from collections import defaultdict, deque
from datetime import timedelta
from threading import Lock
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import create_access_token, verify_password
from app.crud.users import create_user, get_user_by_email
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

DUMMY_PASSWORD_HASH = "$2b$12$wBEDGst3IF5grmZmJ2c0GeAFQFEGX1tvF5jnWSEFkt9o9mCXMdnqS"
_rate_limit_hits: dict[str, deque[float]] = defaultdict(deque)
_rate_limit_lock = Lock()


def enforce_auth_rate_limit(request: Request) -> None:
    client = request.client.host if request.client else "unknown"
    key = f"{request.url.path}:{client}"
    now = monotonic()
    window = settings.AUTH_RATE_LIMIT_WINDOW_SECONDS

    with _rate_limit_lock:
        hits = _rate_limit_hits[key]
        while hits and now - hits[0] > window:
            hits.popleft()
        if len(hits) >= settings.AUTH_RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many authentication attempts",
            )
        hits.append(now)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(
    payload: UserCreate,
    _: None = Depends(enforce_auth_rate_limit),
    db: Session = Depends(get_db),
) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")
    return create_user(db, payload)


@router.post("/login", response_model=Token)
def login(
    _: None = Depends(enforce_auth_rate_limit),
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    user = get_user_by_email(db, form_data.username)
    hashed_password = user.hashed_password if user is not None else DUMMY_PASSWORD_HASH
    password_ok = verify_password(form_data.password, hashed_password)
    if user is None or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(
        subject=user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
