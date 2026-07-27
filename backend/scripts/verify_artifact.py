import argparse
from uuid import UUID

from app.services.mentor_verifier import verify_artifact


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Verify one owned CyberMentor artifact")
    parser.add_argument("--user-id", type=int, required=True)
    parser.add_argument("--artifact-id", type=UUID, required=True)
    return parser.parse_args()


def main() -> None:
    arguments = parse_args()
    result = verify_artifact(
        user_id=arguments.user_id,
        artifact_id=arguments.artifact_id,
    )
    print(result.model_dump_json())


if __name__ == "__main__":
    main()
