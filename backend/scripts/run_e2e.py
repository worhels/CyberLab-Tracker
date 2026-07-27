import json
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
RUNTIME_DIRECTORY = PROJECT_ROOT / "output" / "playwright"
DATABASE_PATH = RUNTIME_DIRECTORY / "cyberlab-e2e.db"

RUNTIME_DIRECTORY.mkdir(parents=True, exist_ok=True)
DATABASE_PATH.unlink(missing_ok=True)

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{DATABASE_PATH.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "e2e-only-secret-key-that-is-longer-than-thirty-two-bytes"
os.environ["OLLAMA_WARMUP_ENABLED"] = "false"
os.environ["CORS_ORIGINS"] = json.dumps(["http://127.0.0.1:4173"])

import uvicorn  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import MentorMessage, Subject, Task, User, UserSettings  # noqa: E402, F401


def main() -> None:
    Base.metadata.create_all(bind=engine)
    try:
        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8001,
            access_log=False,
            log_level="warning",
        )
    finally:
        engine.dispose()
        DATABASE_PATH.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
