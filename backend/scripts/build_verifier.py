from app.services.mentor_verifier import build_verifier_image


def main() -> None:
    image_id = build_verifier_image()
    print(f"Built verifier image {image_id}")


if __name__ == "__main__":
    main()
