from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schema.feature import ArtistCreate, ArtistUpdate, Artist
from ..repo.feature_repo import get_artist, get_artists, create_artist, update_artist, delete_artist
from ..core.dependency import require_admin

router = APIRouter(prefix="/artists")

@router.get("/", response_model=List[Artist])
def list_artists(skip: int = 0, limit: int = Query(50, le=100), search: Optional[str] = None, db: Session = Depends(get_db)):
  """Get all artists with optional search"""
  artists = get_artists(db, skip, limit)
  if search:
    search_lower = search.lower()
    artists = [a for a in artists if search_lower in (a.name_lowercase or "")]
  return artists

@router.get("/{artist_id}", response_model=Artist)
def read_artist(artist_id: str, db: Session = Depends(get_db)):
  """Get specific artist by ID"""
  artist = get_artist(db, artist_id)
  if not artist:
    raise HTTPException(status_code=404, detail="Artist not found")
  return artist

@router.post("/", response_model=Artist)
def add_artist(artist: ArtistCreate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Create new artist (Admin only)"""
  if not artist.name_lowercase:
    artist.name_lowercase = artist.name.lower()
  return create_artist(db, **artist.dict())

@router.put("/{artist_id}", response_model=Artist)
def modify_artist(artist_id: str, artist: ArtistUpdate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Update artist (Admin only)"""
  updated = update_artist(db, artist_id, **artist.dict(exclude_unset=True))
  if not updated:
    raise HTTPException(status_code=404, detail="Artist not found")
  return updated

@router.delete("/{artist_id}")
def remove_artist(artist_id: str, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Delete artist (Admin only)"""
  success = delete_artist(db, artist_id)
  if not success:
    raise HTTPException(status_code=404, detail="Artist not found")
  return {"message": "Artist deleted successfully"}