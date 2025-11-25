from datetime import datetime, timedelta
from jose import jwt, JWTError
from config import settings

def create_access_token(subject: str):
  expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
  payload = {"sub": subject, "exp": expire}
  token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
  return token

def create_refresh_token(subject: str):
  expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
  payload = {"sub": subject, "exp": expire, "type": "refresh"}
  token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
  return token

def verify_token(token: str):
  try:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    return payload
  except JWTError:
    return None