# user
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schema.user import User, UserProfile, UserProfileUpdate
from ..repo.user_repo import get_user_by_id, get_user_by_username, update_user_profile
from ..core.dependency import get_current_user

router = APIRouter(prefix="/users")

@router.get("/me", response_model=User)
def get_me(user = Depends(get_current_user)):
  return user

@router.get("/{user_id}", response_model=User)
def read_user(user_id: str, db: Session = Depends(get_db)):
  user = get_user_by_id(db, user_id)
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user

@router.get("/username/{username}", response_model=User)
def read_user_by_username(username: str, db: Session = Depends(get_db)):
  user = get_user_by_username(db, username)
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user

@router.put("/me/profile", response_model=UserProfile)
def update_my_profile(profile: UserProfileUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  updated = update_user_profile(db, user.id, **profile.dict(exclude_unset=True))
  if not updated:
    raise HTTPException(status_code=404, detail="Profile not found")
  return updated