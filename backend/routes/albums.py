from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schema.feature import AlbumCreate, AlbumUpdate, Album
from ..repo.feature_repo import get_album, get_albums, create_album, update_album, delete_album
from ..core.dependency import require_admin

router = APIRouter(prefix="/albums")

@router.get("/", response_model=List[Album])
def list_albums(skip: int = 0, limit: int = Query(50, le=100), search: Optional[str] = None, db: Session = Depends(get_db)):
  """Get all albums with optional search"""
  albums = get_albums(db, skip, limit)
  if search:
    search_lower = search.lower()
    albums = [a for a in albums if search_lower in (a.title_lowercase or "")]
  for album in albums:
    album.artist_ids = [a.id for a in album.artists]
  return albums

@router.get("/{album_id}", response_model=Album)
def read_album(album_id: str, db: Session = Depends(get_db)):
  """Get specific album by ID"""
  album = get_album(db, album_id)
  if not album:
    raise HTTPException(status_code=404, detail="Album not found")
  album.artist_ids = [a.id for a in album.artists]
  return album

@router.post("/", response_model=Album)
def add_album(album: AlbumCreate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Create new album (Admin only)"""
  data = album.dict()
  artist_ids = data.pop("artist_ids", [])
  if not data.get("title_lowercase"):
    data["title_lowercase"] = data["title"].lower()
  created = create_album(db, artist_ids=artist_ids, **data)
  created.artist_ids = [a.id for a in created.artists]
  return created

@router.put("/{album_id}", response_model=Album)
def modify_album(album_id: str, album: AlbumUpdate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Update album (Admin only)"""
  data = album.dict(exclude_unset=True)
  artist_ids = data.pop("artist_ids", None)
  updated = update_album(db, album_id, artist_ids=artist_ids, **data)
  if not updated:
    raise HTTPException(status_code=404, detail="Album not found")
  updated.artist_ids = [a.id for a in updated.artists]
  return updated

@router.delete("/{album_id}")
def remove_album(album_id: str, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Delete album (Admin only)"""
  success = delete_album(db, album_id)
  if not success:
    raise HTTPException(status_code=404, detail="Album not found")
  return {"message": "Album deleted successfully"}