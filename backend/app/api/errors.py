import logging
from http import HTTPStatus

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)

ERROR_CODES_BY_STATUS: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "unprocessable_entity",
    429: "rate_limited",
    500: "internal_server_error",
    502: "bad_gateway",
    503: "service_unavailable",
}


def _default_message(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase
    except ValueError:
        return "Request failed"


def build_error_payload(
    *,
    status_code: int,
    detail: object,
    code: str | None = None,
    message: str | None = None,
) -> dict[str, object]:
    encoded_detail: object = jsonable_encoder(detail)
    resolved_message = message or (
        encoded_detail if isinstance(encoded_detail, str) else _default_message(status_code)
    )
    error: dict[str, object] = {
        "code": code or ERROR_CODES_BY_STATUS.get(status_code, f"http_{status_code}"),
        "message": resolved_message,
    }
    if not isinstance(encoded_detail, str):
        error["details"] = encoded_detail

    return {
        "detail": encoded_detail,
        "error": error,
    }


async def http_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, StarletteHTTPException):
        raise TypeError("HTTP exception handler received an incompatible exception")
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(status_code=exc.status_code, detail=exc.detail),
        headers=exc.headers,
    )


async def validation_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    if not isinstance(exc, RequestValidationError):
        raise TypeError("Validation exception handler received an incompatible exception")
    validation_details = jsonable_encoder(exc.errors())
    return JSONResponse(
        status_code=422,
        content=build_error_payload(
            status_code=422,
            detail=validation_details,
            code="validation_error",
            message="Request validation failed",
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "Unhandled API exception for %s %s",
        request.method,
        request.url.path,
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content=build_error_payload(
            status_code=500,
            detail="Internal server error",
        ),
    )
