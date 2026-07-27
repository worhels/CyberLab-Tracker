from pathlib import Path

from app.services import mentor_verifier


def verifier_user_argument(arguments: list[str]) -> str:
    return arguments[arguments.index("--user") + 1]


def test_sandbox_command_enforces_required_isolation(tmp_path: Path) -> None:
    image_id = f"sha256:{'a' * 64}"

    arguments = mentor_verifier._sandbox_arguments(
        artifact_directory=tmp_path,
        container_name="verifier-test",
        image_id=image_id,
    )

    assert arguments[:4] == ["run", "--rm", "--name", "verifier-test"]
    assert ["--network", "none"] == arguments[4:6]
    assert "--read-only" in arguments
    assert ["--cap-drop", "ALL"] == arguments[
        arguments.index("--cap-drop"):arguments.index("--cap-drop") + 2
    ]
    assert "no-new-privileges:true" in arguments
    assert verifier_user_argument(arguments) == mentor_verifier.VERIFIER_USER
    assert arguments[-1] == image_id


def test_runtime_rejects_plain_non_rootless_linux(monkeypatch) -> None:
    monkeypatch.setattr(mentor_verifier.platform, "system", lambda: "Linux")

    def fake_run(arguments: list[str], **_) -> object:
        if arguments[:2] == ["context", "show"]:
            return type("Result", (), {"stdout": "default\n"})()
        return type("Result", (), {"stdout": '["name=seccomp,profile=builtin"]'})()

    monkeypatch.setattr(mentor_verifier, "_run_docker", fake_run)

    assert mentor_verifier._runtime_is_accepted() is False


def test_runtime_accepts_docker_desktop_vm(monkeypatch) -> None:
    monkeypatch.setattr(mentor_verifier.platform, "system", lambda: "Windows")

    def fake_run(arguments: list[str], **_) -> object:
        if arguments[:2] == ["context", "show"]:
            return type("Result", (), {"stdout": "desktop-linux\n"})()
        return type("Result", (), {"stdout": '["name=seccomp,profile=builtin"]'})()

    monkeypatch.setattr(mentor_verifier, "_run_docker", fake_run)

    assert mentor_verifier._runtime_is_accepted() is True
