from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from firebase_admin import auth as firebase_auth
from sqlalchemy.orm import Session
from ..database import get_db
from ..core.jwt import create_access_token, create_refresh_token
from ..repo.user_repo import get_user_by_id, create_user

router = APIRouter(prefix="/auth")

class FirebaseTokenIn(BaseModel):
  id_token: str

class TokenOut(BaseModel):
  access_token: str
  refresh_token: str
  token_type: str = "bearer"

@router.post("/firebase", response_model=TokenOut)
def auth_via_firebase(payload: FirebaseTokenIn, db: Session = Depends(get_db)):
  try:
    decoded = firebase_auth.verify_id_token(payload.id_token)
  except Exception:
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Firebase token")
  uid = decoded.get("uid")
  email = decoded.get("email")
  name = decoded.get("name")
  picture = decoded.get("picture")
  user = get_user_by_id(db, uid)
  if not user:
    user = create_user(db, id=uid, email=email, display_name=name, photo_url=picture)
  access = create_access_token(subject=uid)
  refresh = create_refresh_token(subject=uid)
  return {"access_token": access, "refresh_token": refresh}