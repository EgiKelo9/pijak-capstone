from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.models.user import User
from app.shared.token import Token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """
    Dependency untuk mengekstrak dan memvalidasi token, 
    kemudian mengembalikan objek User yang sedang login.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials / Token is invalid or expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_str = credentials.credentials
    token_manager = Token()
    payload = token_manager.verify_token(token_str)
    
    if payload is None:
        raise credentials_exception
        
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None or user.deleted_at is not None:
        raise credentials_exception
        
    return user