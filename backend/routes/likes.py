# likes
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import LikeCreate, Like
from ..repo.feature_repo import get_like, get_likes_by_user, create_like, delete_like
from ..core.dependency import get_current_user

router = APIRouter(prefix="/likes")

@router.get("/user/{user_id}", response_model=List[Like])
def list_user_likes(user_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  return get_likes_by_user(db, user_id, skip, limit)

@router.post("/", response_model=Like)
def add_like(like: LikeCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  existing = get_like(db, like.user_id, like.entity_id, like.entity_type)
  if existing:
    raise HTTPException(status_code=400, detail="Already liked")
  return create_like(db, **like.dict())

@router.delete("/{like_id}")
def remove_like(like_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  success = delete_like(db, like_id)
  if not success:
    raise HTTPException(status_code=404, detail="Like not found")
  return {"message": "Like removed"}