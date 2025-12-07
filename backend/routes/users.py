from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schema.user import User, UserProfile, UserProfileUpdate
from ..repo.user_repo import get_user_by_id, get_user_by_username, update_user_profile, update_user
from ..core.dependency import get_current_user, require_admin

router = APIRouter(prefix="/users")

@router.get("/me", response_model=User)
def get_me(user = Depends(get_current_user)):
  """Get current authenticated user"""
  return user

@router.get("/search", response_model=List[User])
def search_users(q: str, skip: int = 0, limit: int = Query(20, le=50), db: Session = Depends(get_db)):
  """Search users by username or display name"""
  from backend.models.user import User, UserProfile
  profiles = db.query(UserProfile).filter(
    (UserProfile.username.ilike(f"%{q}%")) | (UserProfile.display_name.ilike(f"%{q}%"))
  ).offset(skip).limit(limit).all()
  user_ids = [p.user_id for p in profiles]
  users = db.query(User).filter(User.id.in_(user_ids)).all()
  return users

@router.get("/{user_id}", response_model=User)
def read_user(user_id: str, db: Session = Depends(get_db)):
  """Get user by ID"""
  user = get_user_by_id(db, user_id)
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user

@router.get("/username/{username}", response_model=User)
def read_user_by_username(username: str, db: Session = Depends(get_db)):
  """Get user by username"""
  user = get_user_by_username(db, username)
  if not user:
    raise HTTPException(status_code=404, detail="User not found")
  return user

@router.put("/me/profile", response_model=UserProfile)
def update_my_profile(profile: UserProfileUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Update current user's profile"""
  updated = update_user_profile(db, user.id, **profile.dict(exclude_unset=True))
  if not updated:
    raise HTTPException(status_code=404, detail="Profile not found")
  return updated

@router.put("/{user_id}/role")
def update_user_role(user_id: str, role: str, db: Session = Depends(get_db), admin = Depends(require_admin)):
  """Update user role (Admin only)"""
  if role not in ["user", "curator", "admin"]:
    raise HTTPException(status_code=400, detail="Invalid role. Must be 'user', 'curator', or 'admin'")
  updated = update_user(db, user_id, role=role)
  if not updated:
    raise HTTPException(status_code=404, detail="User not found")
  return {"message": f"User role updated to {role}", "user_id": user_id, "role": role}