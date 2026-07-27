from fastapi.testclient import TestClient


def test_http_errors_use_stable_backward_compatible_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/subjects")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert response.json() == {
        "detail": "Not authenticated",
        "error": {
            "code": "unauthorized",
            "message": "Not authenticated",
        },
    }


def test_validation_errors_include_machine_code_and_structured_details(client: TestClient) -> None:
    response = client.post("/api/v1/auth/register", json={})

    payload = response.json()
    assert response.status_code == 422
    assert payload["detail"] == payload["error"]["details"]
    assert payload["error"]["code"] == "validation_error"
    assert payload["error"]["message"] == "Request validation failed"
    assert {item["loc"][-1] for item in payload["error"]["details"]} >= {"email", "password"}


def test_unknown_routes_use_the_same_error_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/not-a-route")

    assert response.status_code == 404
    assert response.json() == {
        "detail": "Not Found",
        "error": {
            "code": "not_found",
            "message": "Not Found",
        },
    }
