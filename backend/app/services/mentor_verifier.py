import platform
import subprocess
import time
from pathlib import Path
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.services import mentor_artifacts

VERIFIER_IMAGE_TAG = "cyberlab-tracker-verifier:1"
VERIFIER_USER = "65532:65532"
VERIFIER_TIMEOUT_SECONDS = 30
MAX_VERIFIER_OUTPUT_BYTES = 16 * 1024


class VerifierUnavailableError(RuntimeError):
    pass


class VerifierAttestation(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    checks: dict[str, bool]


class VerifierCheck(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    id: Literal["sandbox-attestation", "artifact-tests"]
    status: Literal["passed", "failed"]
    summary: str = Field(max_length=500)


class VerifierResult(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    protocol_version: Literal[1] = 1
    request_id: UUID
    artifact_id: UUID
    artifact_manifest_sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    runner_image_digest: str = Field(pattern=r"^sha256:[0-9a-f]{64}$")
    status: Literal["passed", "failed", "timed_out", "rejected", "runner_error"]
    checks: list[VerifierCheck]
    duration_ms: int = Field(ge=0)
    output: str = Field(max_length=MAX_VERIFIER_OUTPUT_BYTES)
    truncated: bool


def _run_docker(
    arguments: list[str],
    *,
    timeout: float = VERIFIER_TIMEOUT_SECONDS,
    check: bool = False,
) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["docker", *arguments],
            capture_output=True,
            check=check,
            text=True,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise VerifierUnavailableError("Docker was not found") from exc
    except subprocess.TimeoutExpired:
        raise
    except subprocess.CalledProcessError as exc:
        message = (exc.stderr or exc.stdout or "Docker command failed").strip()
        raise VerifierUnavailableError(message[:500]) from exc


def _runtime_is_accepted() -> bool:
    context = _run_docker(["context", "show"], check=True).stdout.strip()
    info = _run_docker(
        ["info", "--format", "{{json .SecurityOptions}}"],
        check=True,
    ).stdout
    has_rootless_runtime = "name=rootless" in info
    is_vm_backed_desktop = (
        context == "desktop-linux"
        and platform.system() in {"Windows", "Darwin"}
    )
    return has_rootless_runtime or is_vm_backed_desktop


def _resolve_image_id(image_tag: str) -> str:
    result = _run_docker(
        ["image", "inspect", image_tag, "--format", "{{.Id}}|{{.Config.User}}"],
        check=True,
    )
    image_id, separator, configured_user = result.stdout.strip().partition("|")
    if separator != "|" or configured_user != VERIFIER_USER:
        raise VerifierUnavailableError("Verifier image does not enforce the expected non-root user")
    if not image_id.startswith("sha256:") or len(image_id) != 71:
        raise VerifierUnavailableError("Verifier image has an invalid immutable ID")
    return image_id


def _sandbox_arguments(
    *,
    artifact_directory: Path,
    container_name: str,
    image_id: str,
) -> list[str]:
    resolved_artifact_directory = artifact_directory.resolve()
    if "," in str(resolved_artifact_directory):
        raise VerifierUnavailableError("Artifact path is incompatible with a safe Docker mount")
    return [
        "run",
        "--rm",
        "--name",
        container_name,
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges:true",
        "--pids-limit",
        "64",
        "--memory",
        "256m",
        "--memory-swap",
        "256m",
        "--cpus",
        "0.50",
        "--user",
        VERIFIER_USER,
        "--tmpfs",
        "/tmp:rw,noexec,nosuid,size=16m",
        "--mount",
        f"type=bind,source={resolved_artifact_directory},target=/input,readonly",
        image_id,
    ]


def _remove_container(container_name: str) -> None:
    _run_docker(["rm", "--force", container_name], timeout=5)


def _run_sandbox(
    arguments: list[str],
    *,
    container_name: str,
    timeout: int,
) -> subprocess.CompletedProcess[str]:
    try:
        return _run_docker(arguments, timeout=timeout)
    finally:
        _remove_container(container_name)


def _attest_sandbox(artifact_directory: Path, image_id: str) -> VerifierCheck:
    container_name = f"cyberlab-verifier-attest-{uuid4()}"
    arguments = _sandbox_arguments(
        artifact_directory=artifact_directory,
        container_name=container_name,
        image_id=image_id,
    )
    arguments[arguments.index(image_id):arguments.index(image_id)] = [
        "--entrypoint",
        "/opt/verifier/attest.py",
    ]
    result = _run_sandbox(arguments, container_name=container_name, timeout=10)
    try:
        attestation = VerifierAttestation.model_validate_json(result.stdout)
    except ValidationError as exc:
        raise VerifierUnavailableError("Verifier attestation returned an invalid payload") from exc
    failed_checks = sorted(name for name, passed in attestation.checks.items() if not passed)
    if result.returncode != 0 or failed_checks:
        raise VerifierUnavailableError(
            f"Verifier sandbox attestation failed: {', '.join(failed_checks) or 'runner error'}"
        )
    return VerifierCheck(
        id="sandbox-attestation",
        status="passed",
        summary="Non-root, read-only, capability-free, no-egress sandbox attested.",
    )


def verify_artifact(
    *,
    user_id: int,
    artifact_id: UUID,
    image_tag: str = VERIFIER_IMAGE_TAG,
) -> VerifierResult:
    started_at = time.monotonic()
    artifact_directory, manifest_sha256 = mentor_artifacts.get_verified_artifact_directory(
        user_id,
        artifact_id,
    )
    if not _runtime_is_accepted():
        raise VerifierUnavailableError(
            "Verifier requires rootless Docker or an attested Docker Desktop Linux VM"
        )
    image_id = _resolve_image_id(image_tag)
    attestation_check = _attest_sandbox(artifact_directory, image_id)
    container_name = f"cyberlab-verifier-run-{uuid4()}"
    arguments = _sandbox_arguments(
        artifact_directory=artifact_directory,
        container_name=container_name,
        image_id=image_id,
    )

    try:
        result = _run_sandbox(
            arguments,
            container_name=container_name,
            timeout=VERIFIER_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        duration_ms = round((time.monotonic() - started_at) * 1000)
        return VerifierResult(
            request_id=uuid4(),
            artifact_id=artifact_id,
            artifact_manifest_sha256=manifest_sha256,
            runner_image_digest=image_id,
            status="timed_out",
            checks=[attestation_check],
            duration_ms=duration_ms,
            output="Verifier exceeded the fixed wall-clock limit.",
            truncated=False,
        )

    raw_output = f"{result.stdout}\n{result.stderr}".strip()
    encoded_output = raw_output.encode("utf-8")
    truncated = len(encoded_output) > MAX_VERIFIER_OUTPUT_BYTES
    output = encoded_output[:MAX_VERIFIER_OUTPUT_BYTES].decode("utf-8", errors="replace")
    artifact_check = VerifierCheck(
        id="artifact-tests",
        status="passed" if result.returncode == 0 else "failed",
        summary="Reviewed artifact tests passed." if result.returncode == 0 else "Reviewed artifact tests failed.",
    )
    duration_ms = round((time.monotonic() - started_at) * 1000)
    return VerifierResult(
        request_id=uuid4(),
        artifact_id=artifact_id,
        artifact_manifest_sha256=manifest_sha256,
        runner_image_digest=image_id,
        status="passed" if result.returncode == 0 else "failed",
        checks=[attestation_check, artifact_check],
        duration_ms=duration_ms,
        output=output,
        truncated=truncated,
    )


def build_verifier_image(image_tag: str = VERIFIER_IMAGE_TAG) -> str:
    verifier_directory = Path(__file__).resolve().parents[2] / "verifier"
    _run_docker(
        [
            "build",
            "--pull",
            "--tag",
            image_tag,
            str(verifier_directory),
        ],
        timeout=300,
        check=True,
    )
    return _resolve_image_id(image_tag)
