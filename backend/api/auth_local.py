from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from ..database import get_db
from ..repo.user_repo import get_user_by_email, create_user_with_password
from ..core.security import verify_password
from ..core.jwt import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth")

class RegisterIn(BaseModel):
  id: str
  email: EmailStr
  password: str
  username: str

class LoginIn(BaseModel):
  email: EmailStr
  password: str

class TokenOut(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"

@router.post("/register", response_model=TokenOut)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
  existing = get_user_by_email(db, payload.email)
  if existing:
    raise HTTPException(status_code=400, detail="Email already registered")
  user = create_user_with_password(db, id=payload.id, email=payload.email, password=payload.password, username=payload.username)
  access = create_access_token(subject=user.id)
  refresh = create_refresh_token(subject=user.id)
  return {"access_token": access, "refresh_token": refresh}

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
  user = get_user_by_email(db, payload.email)
  if not user or not verify_password(payload.password, user.password_hash):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
  access = create_access_token(subject=user.id)
  refresh = create_refresh_token(subject=user.id)
  return {"access_token": access, "refresh_token": refresh}