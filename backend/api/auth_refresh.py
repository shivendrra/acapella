from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from ..core.jwt import verify_token, create_access_token
from ..database import get_db
from ..repo.user_repo import get_user_by_id

router = APIRouter(prefix="/auth")

class RefreshIn(BaseModel):
  refresh_token: str

class TokenOut(BaseModel):
  access_token: str
  token_type: str = "bearer"

@router.post("/refresh", response_model=TokenOut)
def refresh_token(payload: RefreshIn):
  payload_data = verify_token(payload.refresh_token)
  if not payload_data or payload_data.get("type") != "refresh":
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
  user_id = payload_data.get("sub")
  access = create_access_token(subject=user_id)
  return {"access_token": access}