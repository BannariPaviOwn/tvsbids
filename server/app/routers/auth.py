import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserLogin, Token, UserResponse
from ..auth import get_password_hash, create_access_token, verify_password
from ..config import settings

router = APIRouter()

# Indian mobile: 10 digits, starting with 6-9
MOBILE_REGEX = re.compile(r"^[6-9]\d{9}$")


def _user_response(user: User) -> UserResponse:
    return UserResponse.model_validate(user).model_copy(
        update={"is_admin": user.username.lower() in settings.admin_usernames_list}
    )


def _normalize_mobile(mobile: str) -> str:
    """Strip spaces and keep digits only for comparison."""
    return re.sub(r"\D", "", mobile)


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    mobile = _normalize_mobile(user_data.mobile_number)
    if len(mobile) != 10 or not mobile.startswith(("6", "7", "8", "9")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid 10-digit Indian mobile number"
        )
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    if db.query(User).filter(User.mobile_number == mobile).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This mobile number is already registered. One account per mobile."
        )
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    user = User(
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        mobile_number=mobile,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user=_user_response(user)
    )


@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    is_active = getattr(user, "is_active", 1)
    if is_active == 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact admin."
        )
    token = create_access_token(data={"sub": str(user.id)})
    return Token(
        access_token=token,
        token_type="bearer",
        user=_user_response(user)
    )
