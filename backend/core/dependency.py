from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from ..database import get_db
from .jwt import verify_token
from ..repo.user_repo import get_user_by_id

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
  token = credentials.credentials
  payload = verify_token(token)
  if not payload or payload.get("type") != "access":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
  user_id = payload.get("sub")
  user = get_user_by_id(db, user_id)
  if not user:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
  return user

def require_admin(user = Depends(get_current_user)):
  if user.role != "admin":
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
  return user

def require_curator(user = Depends(get_current_user)):
  if user.role not in ["curator", "admin"]:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Curator access required")
  return user