from pydantic import BaseModel, EmailStr, constr
from datetime import datetime
from typing import Optional, Annotated

class UserBase(BaseModel):
  username: Annotated[str, constr(min_length=3, max_length=50)]
  email: EmailStr
  bio: Optional[str] = None

class UserCreate(UserBase):
  password: Annotated[str, constr(min_length=6)]

class UserLogin(BaseModel):
  email: EmailStr
  password: str

class UserRead(UserBase):
  id: int
  role: str
  created_at: datetime
  updated_at: datetime

  class Config:
    orm_mode = True

class UserUpdate(BaseModel):
  username: Optional[Annotated[str, constr(min_length=3, max_length=50)]] = None
  bio: Optional[str] = None
  email: Optional[EmailStr] = None
  password: Optional[Annotated[str, constr(min_length=6)]] = None