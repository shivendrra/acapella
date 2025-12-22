from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import ReviewCreate, ReviewUpdate, Review
from ..repo.feature_repo import get_review, get_reviews_by_user, get_reviews_by_entity, create_review, update_review, delete_review
from ..core.dependency import get_current_user

router = APIRouter(prefix="/reviews")

@router.get("/user/{user_id}", response_model=List[Review])
def list_user_reviews(user_id: str, skip: int = 0, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
  """Get all reviews by a specific user"""
  return get_reviews_by_user(db, user_id, skip, limit)

@router.get("/entity/{entity_type}/{entity_id}", response_model=List[Review])
def list_entity_reviews(entity_type: str, entity_id: str, skip: int = 0, limit: int = Query(50, le=100), db: Session = Depends(get_db)):
  """Get all reviews for a specific entity (song/album)"""
  if entity_type not in ["song", "album"]:
    raise HTTPException(status_code=400, detail="Entity type must be 'song' or 'album'")
  return get_reviews_by_entity(db, entity_id, entity_type, skip, limit)

@router.get("/{review_id}", response_model=Review)
def read_review(review_id: str, db: Session = Depends(get_db)):
  """Get specific review by ID"""
  review = get_review(db, review_id)
  if not review:
    raise HTTPException(status_code=404, detail="Review not found")
  return review

@router.post("/", response_model=Review)
def add_review(review: ReviewCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Create new review"""
  if review.user_id != user.id:
    raise HTTPException(status_code=403, detail="Cannot create review for another user")
  if review.rating < 1 or review.rating > 5:
    raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
  return create_review(db, **review.dict())

@router.put("/{review_id}", response_model=Review)
def modify_review(review_id: str, review: ReviewUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Update review (owner only)"""
  existing = get_review(db, review_id)
  if not existing:
    raise HTTPException(status_code=404, detail="Review not found")
  if existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized to edit this review")
  data = review.dict(exclude_unset=True)
  if "rating" in data and (data["rating"] < 1 or data["rating"] > 5):
    raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
  updated = update_review(db, review_id, **data)
  return updated

@router.delete("/{review_id}")
def remove_review(review_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  """Delete review (owner only)"""
  existing = get_review(db, review_id)
  if not existing:
    raise HTTPException(status_code=404, detail="Review not found")
  if existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized to delete this review")
  delete_review(db, review_id)
  return {"message": "Review deleted successfully"}