import os
import subprocess
import sys
import time

POSTGRES_IMAGE = (
    "postgres:16-alpine@"
    "sha256:57c72fd2a128e416c7fcc499958864df5301e940bca0a56f58fddf30ffc07777"
)
POSTGRES_USER = "cyberlab_e2e"
POSTGRES_PASSWORD = "cyberlab-e2e-password"
POSTGRES_DATABASE = "cyberlab_e2e"
CONTAINER_NAME = "cyberlab-tracker-e2e-postgres"


def run_docker(*arguments: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["docker", *arguments],
        check=check,
        capture_output=True,
        text=True,
    )


def start_postgres() -> int:
    stop_postgres()
    run_docker(
        "run",
        "--detach",
        "--rm",
        "--name",
        CONTAINER_NAME,
        "--publish",
        "127.0.0.1::5432",
        "--tmpfs",
        "/var/lib/postgresql/data:rw,noexec,nosuid,size=256m",
        "--env",
        f"POSTGRES_USER={POSTGRES_USER}",
        "--env",
        f"POSTGRES_PASSWORD={POSTGRES_PASSWORD}",
        "--env",
        f"POSTGRES_DB={POSTGRES_DATABASE}",
        POSTGRES_IMAGE,
    )

    port_output = run_docker("port", CONTAINER_NAME, "5432/tcp").stdout.strip()
    port = int(port_output.rsplit(":", maxsplit=1)[1])
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        readiness = run_docker(
            "exec",
            CONTAINER_NAME,
            "pg_isready",
            "--username",
            POSTGRES_USER,
            "--dbname",
            POSTGRES_DATABASE,
            check=False,
        )
        if readiness.returncode == 0:
            return port
        time.sleep(0.25)
    raise RuntimeError("The isolated E2E PostgreSQL container did not become ready")


def stop_postgres() -> None:
    run_docker("rm", "--force", CONTAINER_NAME, check=False)


def main() -> None:
    try:
        postgres_port = start_postgres()
        os.environ["DATABASE_URL"] = (
            f"postgresql+psycopg://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
            f"@127.0.0.1:{postgres_port}/{POSTGRES_DATABASE}"
        )
        os.environ["JWT_SECRET_KEY"] = "e2e-only-secret-key-that-is-longer-than-thirty-two-bytes"
        os.environ["OLLAMA_WARMUP_ENABLED"] = "false"
        os.environ["CORS_ORIGINS"] = '["http://127.0.0.1:4173"]'

        subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            check=True,
        )

        import uvicorn

        from app.main import app

        uvicorn.run(
            app,
            host="127.0.0.1",
            port=8001,
            access_log=False,
            log_level="warning",
        )
    finally:
        stop_postgres()


if __name__ == "__main__":
    main()
