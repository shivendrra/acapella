# reviews
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import ReviewCreate, ReviewUpdate, Review
from ..repo.feature_repo import get_review, get_reviews_by_user, get_reviews_by_entity, create_review, update_review, delete_review
from ..core.dependency import get_current_user

router = APIRouter(prefix="/reviews")

@router.get("/user/{user_id}", response_model=List[Review])
def list_user_reviews(user_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  return get_reviews_by_user(db, user_id, skip, limit)

@router.get("/entity/{entity_type}/{entity_id}", response_model=List[Review])
def list_entity_reviews(entity_type: str, entity_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  return get_reviews_by_entity(db, entity_id, entity_type, skip, limit)

@router.get("/{review_id}", response_model=Review)
def read_review(review_id: str, db: Session = Depends(get_db)):
  review = get_review(db, review_id)
  if not review:
    raise HTTPException(status_code=404, detail="Review not found")
  return review

@router.post("/", response_model=Review)
def add_review(review: ReviewCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  return create_review(db, **review.dict())

@router.put("/{review_id}", response_model=Review)
def modify_review(review_id: str, review: ReviewUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  existing = get_review(db, review_id)
  if not existing or existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized")
  updated = update_review(db, review_id, **review.dict(exclude_unset=True))
  return updated

@router.delete("/{review_id}")
def remove_review(review_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  existing = get_review(db, review_id)
  if not existing or existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized")
  delete_review(db, review_id)
  return {"message": "Review deleted"}