from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import Follow, FollowCreate
from ..repo.user_repo import follow_user, unfollow_user, get_followers, get_following
from ..core.dependency import get_current_user

router = APIRouter(prefix="/follows")

@router.post("/", response_model=Follow)
def add_follow(follow: FollowCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Follow a user"""
  if follow.follower_id != user.id:
    raise HTTPException(status_code=403, detail="Cannot follow on behalf of another user")
  if follow.follower_id == follow.following_id:
    raise HTTPException(status_code=400, detail="Cannot follow yourself")
  result = follow_user(db, follow.follower_id, follow.following_id)
  if not result:
    raise HTTPException(status_code=400, detail="Already following this user")
  return result

@router.delete("/{following_id}")
def remove_follow(following_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Unfollow a user"""
  success = unfollow_user(db, user.id, following_id)
  if not success:
    raise HTTPException(status_code=404, detail="Follow relationship not found")
  return {"message": "Unfollowed successfully"}

@router.get("/followers/{user_id}", response_model=List[Follow])
def list_followers(user_id: str, skip: int = 0, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
  """Get all followers of a user"""
  return get_followers(db, user_id, skip, limit)

@router.get("/following/{user_id}", response_model=List[Follow])
def list_following(user_id: str, skip: int = 0, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
  """Get all users that a user is following"""
  return get_following(db, user_id, skip, limit)

@router.get("/check/{user_id}")
def check_follow(user_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Check if current user is following another user"""
  from backend.models.user import Follow
  follow = db.query(Follow).filter(Follow.follower_id == user.id, Follow.following_id == user_id).first()
  return {"following": follow is not None}

@router.get("/stats/{user_id}")
def follow_stats(user_id: str, db: Session = Depends(get_db)):
  """Get follow statistics for a user"""
  from backend.models.user import UserProfile
  profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
  if not profile:
    raise HTTPException(status_code=404, detail="User not found")
  return {
    "user_id": user_id,
    "followers_count": profile.followers_count or 0,
    "following_count": profile.following_count or 0
  }