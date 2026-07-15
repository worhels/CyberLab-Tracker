import importlib.util
import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pytest import MonkeyPatch

from app.core.config import settings
from app.services import mentor_artifacts


pytestmark = [
    pytest.mark.ollama,
    pytest.mark.skipif(
        os.getenv("RUN_OLLAMA_TESTS") != "1",
        reason="Set RUN_OLLAMA_TESTS=1 to run the local Ollama acceptance test",
    ),
]


def test_live_model_builds_a_working_bcrypt_timing_artifact(
    tmp_path: Path,
    monkeypatch: MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MENTOR_ARTIFACT_ROOT", tmp_path / "artifacts")
    spec, model_digest = mentor_artifacts.generate_artifact_spec(
        (
            "Create a minimal English bcrypt timing web prototype. It must measure one hash, "
            "use a password field, show elapsed milliseconds, and include automated tests."
        ),
        "en",
    )

    assert spec.template == "bcrypt-timing-web-v1"
    assert spec.default_rounds in {10, 11, 12, 13}
    artifact = mentor_artifacts.create_artifact(
        user_id=1,
        task_id=None,
        goal="live Ollama bcrypt artifact acceptance",
        language="en",
        spec=spec,
        model_digest=model_digest,
    )
    assert [item.path for item in artifact.files] == list(
        mentor_artifacts.ARTIFACT_ARCHIVE_PATHS
    )

    artifact_directory = settings.MENTOR_ARTIFACT_ROOT / "1" / str(artifact.id)
    module_spec = importlib.util.spec_from_file_location(
        "live_generated_bcrypt_artifact",
        artifact_directory / "app.py",
    )
    assert module_spec is not None
    assert module_spec.loader is not None
    generated_module = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(generated_module)

    generated_client = TestClient(generated_module.app)
    assert generated_client.get("/").status_code == 200
    response = generated_client.post(
        "/api/hash",
        json={"password": "demo-password", "rounds": 10},
    )
    assert response.status_code == 200
    assert response.json()["verified"] is True
    assert response.json()["elapsed_ms"] >= 0
    assert "password" not in response.json()
