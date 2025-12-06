from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
load_dotenv()

SECRET_KEY = os.getenv("SECURITY_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_EXPIRE_MIN = 30
REFRESH_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str: return pwd_context.hash(password)
def verify_password(plain: str, hashed: str) -> bool: return pwd_context.verify(plain, hashed)

def create_access_token(data: dict):
  to_encode = data.copy()
  to_encode["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE_MIN)
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
  to_encode = data.copy()
  to_encode["exp"] = datetime.utcnow() + timedelta(days=REFRESH_EXPIRE_DAYS)
  return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)