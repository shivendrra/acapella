from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schema.feature import PlaylistCreate, PlaylistUpdate, Playlist
from ..repo.feature_repo import get_playlist, get_playlists_by_user, create_playlist, update_playlist, delete_playlist
from ..core.dependency import get_current_user

router = APIRouter(prefix="/playlists")

@router.get("/user/{user_id}", response_model=List[Playlist])
def list_user_playlists(user_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
  playlists = get_playlists_by_user(db, user_id, skip, limit)
  for pl in playlists:
    pl.song_ids = [s.id for s in pl.songs]
  return playlists

@router.get("/{playlist_id}", response_model=Playlist)
def read_playlist(playlist_id: str, db: Session = Depends(get_db)):
  playlist = get_playlist(db, playlist_id)
  if not playlist:
    raise HTTPException(status_code=404, detail="Playlist not found")
  playlist.song_ids = [s.id for s in playlist.songs]
  return playlist

@router.post("/", response_model=Playlist)
def add_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  data = playlist.dict()
  song_ids = data.pop("song_ids", [])
  created = create_playlist(db, song_ids=song_ids, **data)
  created.song_ids = [s.id for s in created.songs]
  return created

@router.put("/{playlist_id}", response_model=Playlist)
def modify_playlist(playlist_id: str, playlist: PlaylistUpdate, db: Session = Depends(get_db), user = Depends(get_current_user)):
  existing = get_playlist(db, playlist_id)
  if not existing or existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized")
  data = playlist.dict(exclude_unset=True)
  song_ids = data.pop("song_ids", None)
  updated = update_playlist(db, playlist_id, song_ids=song_ids, **data)
  updated.song_ids = [s.id for s in updated.songs]
  return updated

@router.delete("/{playlist_id}")
def remove_playlist(playlist_id: str, db: Session = Depends(get_db), user = Depends(get_current_user)):
  existing = get_playlist(db, playlist_id)
  if not existing or existing.user_id != user.id:
    raise HTTPException(status_code=403, detail="Not authorized")
  delete_playlist(db, playlist_id)
  return {"message": "Playlist deleted"}