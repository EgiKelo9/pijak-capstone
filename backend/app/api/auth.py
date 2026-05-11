import httpx
from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter
from fastapi.security import OAuth2PasswordRequestForm
from app.core.models import User
from app.core.database import get_db
from app.schemas.auth import UserRegisterRequest, UserRegisterResponse, TokenResponse
from app.core.security import get_password_hash, create_access_token, verify_password

router = APIRouter()

@router.post("/auth/register", response_model=UserRegisterResponse)
def register_user(user: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Endpoint untuk registrasi user baru. Menerima username, email, dan password.
    Password akan di-hash sebelum disimpan ke database.
    """
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    new_user = User(name=user.username, email=user.email, password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/auth/login", response_model=TokenResponse)
def login_user(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    """
    Endpoint untuk login user. Menerima email dan password.
    Jika valid, mengembalikan JWT token untuk otentikasi selanjutnya.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=401, 
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=access_token, token_type="bearer")