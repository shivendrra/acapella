from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schema.feature import SongCreate, SongUpdate, Song
from ..repo.feature_repo import get_song, get_songs, create_song, update_song, delete_song
from ..core.dependency import require_admin

router = APIRouter(prefix="/songs")

@router.get("/", response_model=List[Song])
def list_songs(skip: int = 0, limit: int = Query(50, le=100), search: Optional[str] = None, db: Session = Depends(get_db)):
  """Get all songs with optional search"""
  songs = get_songs(db, skip, limit)
  if search:
    search_lower = search.lower()
    songs = [s for s in songs if search_lower in (s.title_lowercase or "")]
  for song in songs:
    song.artist_ids = [a.id for a in song.artists]
  return songs

@router.get("/{song_id}", response_model=Song)
def read_song(song_id: str, db: Session = Depends(get_db)):
  """Get specific song by ID"""
  song = get_song(db, song_id)
  if not song:
    raise HTTPException(status_code=404, detail="Song not found")
  song.artist_ids = [a.id for a in song.artists]
  return song

@router.post("/", response_model=Song)
def add_song(song: SongCreate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Create new song (Admin only)"""
  data = song.dict()
  artist_ids = data.pop("artist_ids", [])
  if not data.get("title_lowercase"):
    data["title_lowercase"] = data["title"].lower()
  created = create_song(db, artist_ids=artist_ids, **data)
  created.artist_ids = [a.id for a in created.artists]
  return created

@router.put("/{song_id}", response_model=Song)
def modify_song(song_id: str, song: SongUpdate, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Update song (Admin only)"""
  data = song.dict(exclude_unset=True)
  artist_ids = data.pop("artist_ids", None)
  updated = update_song(db, song_id, artist_ids=artist_ids, **data)
  if not updated:
    raise HTTPException(status_code=404, detail="Song not found")
  updated.artist_ids = [a.id for a in updated.artists]
  return updated

@router.delete("/{song_id}")
def remove_song(song_id: str, db: Session = Depends(get_db), user = Depends(require_admin)):
  """Delete song (Admin only)"""
  success = delete_song(db, song_id)
  if not success:
    raise HTTPException(status_code=404, detail="Song not found")
  return {"message": "Song deleted successfully"}