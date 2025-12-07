from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import LikeCreate, Like
from ..repo.feature_repo import get_like, get_likes_by_user, create_like, delete_like
from ..core.dependency import get_current_user

router = APIRouter(prefix="/likes")

@router.get("/user/{user_id}", response_model=List[Like])
def list_user_likes(user_id: str, skip: int = 0, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
  """Get all likes by a specific user"""
  return get_likes_by_user(db, user_id, skip, limit)

@router.get("/check/{entity_type}/{entity_id}")
def check_like(entity_type: str, entity_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Check if current user has liked an entity"""
  like = get_like(db, user.id, entity_id, entity_type)
  return {"liked": like is not None, "like_id": like.id if like else None}

@router.post("/", response_model=Like)
def add_like(like: LikeCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Create new like"""
  if like.user_id != user.id:
    raise HTTPException(status_code=403, detail="Cannot create like for another user")
  if like.entity_type not in ["song", "album", "review"]:
    raise HTTPException(status_code=400, detail="Entity type must be 'song', 'album', or 'review'")
  existing = get_like(db, like.user_id, like.entity_id, like.entity_type)
  if existing:
    raise HTTPException(status_code=400, detail="Already liked this entity")
  return create_like(db, **like.dict())

@router.delete("/{like_id}")
def remove_like(like_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Remove like (owner only)"""
  like = db.query(Like).filter(Like.id == like_id).first()
  if not like:
    raise HTTPException(status_code=404, detail="Like not found")
  if like.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized to remove this like")
  success = delete_like(db, like_id)
  if not success:
    raise HTTPException(status_code=404, detail="Like not found")
  return {"message": "Like removed successfully"}

@router.delete("/entity/{entity_type}/{entity_id}")
def remove_like_by_entity(entity_type: str, entity_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Unlike an entity"""
  like = get_like(db, user.id, entity_id, entity_type)
  if not like:
    raise HTTPException(status_code=404, detail="Like not found")
  success = delete_like(db, like.id)
  return {"message": "Like removed successfully"}