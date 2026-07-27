FROM python:3.12-alpine@sha256:6d43704baacd1bfbe7c295d7f13079d5d8104ed33568873133f8fc69980419df

RUN addgroup -S -g 65532 verifier \
    && adduser -S -D -H -u 65532 -G verifier verifier \
    && python -m pip install --no-cache-dir \
        bcrypt==5.0.0 \
        fastapi==0.140.0 \
        httpx==0.28.1 \
        pytest==8.4.2

COPY --chown=65532:65532 attest.py /opt/verifier/attest.py

USER 65532:65532
WORKDIR /input

ENTRYPOINT ["python", "-m", "pytest", "-q", "--disable-warnings", "--maxfail=1", "/input/tests/test_app.py"]
