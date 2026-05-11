from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserRegisterResponse(BaseModel):
    id: UUID
    username: str
    email: EmailStr

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str