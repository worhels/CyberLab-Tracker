import os
from pathlib import Path

import pytest
from pytest import MonkeyPatch

from app.core.config import settings
from app.schemas.mentor_artifact import MentorArtifactSpec
from app.services import mentor_artifacts, mentor_verifier

pytestmark = [
    pytest.mark.verifier,
    pytest.mark.skipif(
        os.getenv("RUN_VERIFIER_TESTS") != "1",
        reason="Set RUN_VERIFIER_TESTS=1 to run the Docker verifier acceptance test",
    ),
]


def test_reviewed_artifact_runs_in_attested_sandbox(
    tmp_path: Path,
    monkeypatch: MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "MENTOR_ARTIFACT_ROOT", tmp_path / "artifacts")
    artifact = mentor_artifacts.create_artifact(
        user_id=42,
        task_id=None,
        goal="Verify the reviewed bcrypt lab",
        language="en",
        spec=MentorArtifactSpec(
            schema_version="1",
            template="bcrypt-timing-web-v1",
            title="Bcrypt timing prototype",
            description="Measure one local bcrypt password hash operation.",
            default_rounds=10,
        ),
        model_digest="sha256:test-model",
    )
    mentor_verifier.build_verifier_image()

    result = mentor_verifier.verify_artifact(user_id=42, artifact_id=artifact.id)

    assert result.status == "passed"
    assert [check.status for check in result.checks] == ["passed", "passed"]
