
# follow
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import Follow, FollowCreate
from ..repo.user_repo import follow_user, unfollow_user, get_followers, get_following
from ..core.dependency import get_current_user

router = APIRouter(prefix="/follows")

@router.post("/", response_model=Follow)
def add_follow(follow: FollowCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  result = follow_user(db, follow.follower_id, follow.following_id)
  if not result:
    raise HTTPException(status_code=400, detail="Cannot follow")
  return result

@router.delete("/{follower_id}/{following_id}")
def remove_follow(follower_id: str, following_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  if user.id != follower_id:
    raise HTTPException(status_code=403, detail="Not authorized")
  success = unfollow_user(db, follower_id, following_id)
  if not success:
    raise HTTPException(status_code=404, detail="Follow not found")
  return {"message": "Unfollowed"}

@router.get("/followers/{user_id}", response_model=List[Follow])
def list_followers(user_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  return get_followers(db, user_id, skip, limit)

@router.get("/following/{user_id}", response_model=List[Follow])
def list_following(user_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  return get_following(db, user_id, skip, limit)