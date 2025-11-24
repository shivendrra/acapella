from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel

# Artist Schemas
class ArtistBase(BaseModel):
  name: str
  bio: Optional[str] = None

class ArtistCreate(ArtistBase):
  pass

class ArtistRead(ArtistBase):
  id: int

  class Config:
    orm_mode = True

# Album Schemas
class AlbumBase(BaseModel):
  title: str
  release_date: Optional[date] = None
  cover_url: Optional[str] = None

class AlbumCreate(AlbumBase):
  artist_id: int

class AlbumRead(AlbumBase):
  id: int
  artist_id: int

  class Config:
    orm_mode = True

# Song Schemas
class SongBase(BaseModel):
  title: str
  duration: Optional[int] = None  # duration in seconds
  track_number: Optional[int] = None

class SongCreate(SongBase):
  album_id: int
  artist_id: int

class SongRead(SongBase):
  id: int
  album_id: int
  artist_id: int

  class Config:
    orm_mode = True

# Review / Rating Schemas
class ReviewBase(BaseModel):
  rating: int  # 1–5
  text: Optional[str] = None

class ReviewCreate(ReviewBase):
  user_id: int
  # either song or album:
  song_id: Optional[int] = None
  album_id: Optional[int] = None

class ReviewRead(ReviewBase):
  id: int
  user_id: int
  song_id: Optional[int]
  album_id: Optional[int]
  created_at: datetime
  updated_at: datetime

  class Config:
    orm_mode = True

# Playlist Schema
class PlaylistBase(BaseModel):
  name: str
  description: Optional[str] = None

class PlaylistCreate(PlaylistBase):
  user_id: int

class PlaylistRead(PlaylistBase):
  id: int
  user_id: int
  song_ids: List[int]

  class Config:
    orm_mode = True