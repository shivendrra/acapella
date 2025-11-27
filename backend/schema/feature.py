from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class ArtistBase(BaseModel):
  name: str
  name_lowercase: Optional[str]
  image_url: Optional[str]
  cover_image_url: Optional[str]
  genres: Optional[List[str]]
  bio: Optional[str]
  socials: Optional[Dict]
  platform_links: Optional[Dict]

class ArtistCreate(ArtistBase):
  id: str

class ArtistUpdate(BaseModel):
  name: Optional[str]
  name_lowercase: Optional[str]
  image_url: Optional[str]
  cover_image_url: Optional[str]
  genres: Optional[List[str]]
  bio: Optional[str]
  socials: Optional[Dict]
  platform_links: Optional[Dict]

class Artist(ArtistBase):
  id: str

  class Config:
    orm_mode = True

class AlbumBase(BaseModel):
  title: str
  title_lowercase: Optional[str]
  release_date: Optional[str]
  cover_art_url: Optional[str]
  genre: Optional[str]
  associated_film: Optional[str]
  platform_links: Optional[Dict]
  tracklist: Optional[List[str]]
  review_count: Optional[int]
  likes_count: Optional[int]

class AlbumCreate(AlbumBase):
  id: str
  artist_ids: List[str]

class AlbumUpdate(BaseModel):
  title: Optional[str]
  title_lowercase: Optional[str]
  release_date: Optional[str]
  cover_art_url: Optional[str]
  genre: Optional[str]
  associated_film: Optional[str]
  platform_links: Optional[Dict]
  tracklist: Optional[List[str]]

class Album(AlbumBase):
  id: str
  artist_ids: Optional[List[str]]

  class Config:
    orm_mode = True

class SongBase(BaseModel):
  title: str
  title_lowercase: Optional[str]
  album_id: Optional[str]
  duration: int
  release_date: Optional[str]
  genre: Optional[str]
  credits: Optional[Dict]
  cover_art_url: Optional[str]
  platform_links: Optional[Dict]
  review_count: Optional[int]
  likes_count: Optional[int]

class SongCreate(SongBase):
  id: str
  artist_ids: List[str]

class SongUpdate(BaseModel):
  title: Optional[str]
  title_lowercase: Optional[str]
  album_id: Optional[str]
  duration: Optional[int]
  release_date: Optional[str]
  genre: Optional[str]
  credits: Optional[Dict]
  cover_art_url: Optional[str]
  platform_links: Optional[Dict]

class Song(SongBase):
  id: str
  artist_ids: Optional[List[str]]

  class Config:
    orm_mode = True

class PlaylistBase(BaseModel):
  title: str
  description: Optional[str]
  cover_art_url: Optional[str]
  created_at: Optional[datetime]
  updated_at: Optional[datetime]
  is_public: Optional[bool]
  platform_links: Optional[Dict]
  song_ids: Optional[List[str]]

class PlaylistCreate(PlaylistBase):
  id: str
  user_id: str

class PlaylistUpdate(BaseModel):
  title: Optional[str]
  description: Optional[str]
  cover_art_url: Optional[str]
  updated_at: Optional[datetime]
  is_public: Optional[bool]
  platform_links: Optional[Dict]
  song_ids: Optional[List[str]]

class Playlist(PlaylistBase):
  id: str
  user_id: str

  class Config:
    orm_mode = True

class ReviewBase(BaseModel):
  rating: int
  review_text: Optional[str]
  entity_id: str
  entity_type: str
  entity_title: Optional[str]
  entity_cover_art_url: Optional[str]
  entity_username: Optional[str]

class ReviewCreate(ReviewBase):
  id: str
  user_id: str
  song_id: Optional[str]

class ReviewUpdate(BaseModel):
  rating: Optional[int]
  review_text: Optional[str]

class Review(ReviewBase):
  id: str
  user_id: str
  created_at: datetime
  likes_count: Optional[int]
  song_id: Optional[str]

  class Config:
    orm_mode = True

class LikeBase(BaseModel):
  entity_id: str
  entity_type: str
  entity_title: Optional[str]
  entity_cover_art_url: Optional[str]
  review_on_entity_type: Optional[str]
  review_on_entity_id: Optional[str]
  review_on_entity_title: Optional[str]

class LikeCreate(LikeBase):
  id: str
  user_id: str

class Like(LikeBase):
  id: str
  user_id: str
  created_at: datetime

  class Config:
    orm_mode = True

class FollowBase(BaseModel):
  created_at: Optional[datetime]

class FollowCreate(FollowBase):
  follower_id: str
  following_id: str

class Follow(FollowBase):
  follower_id: str
  following_id: str

  class Config:
    orm_mode = True