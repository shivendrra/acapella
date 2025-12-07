from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict
from datetime import datetime

class ArtistBase(BaseModel):
  name: str
  name_lowercase: Optional[str] = None
  image_url: Optional[str] = None
  cover_image_url: Optional[str] = None
  genres: Optional[List[str]] = None
  bio: Optional[str] = None
  socials: Optional[Dict] = None
  platform_links: Optional[Dict] = None

class ArtistCreate(ArtistBase):
  id: str

class ArtistUpdate(BaseModel):
  name: Optional[str] = None
  name_lowercase: Optional[str] = None
  image_url: Optional[str] = None
  cover_image_url: Optional[str] = None
  genres: Optional[List[str]] = None
  bio: Optional[str] = None
  socials: Optional[Dict] = None
  platform_links: Optional[Dict] = None

class Artist(ArtistBase):
  id: str
  model_config = ConfigDict(from_attributes=True)

class AlbumBase(BaseModel):
  title: str
  title_lowercase: Optional[str] = None
  release_date: Optional[str] = None
  cover_art_url: Optional[str] = None
  genre: Optional[str] = None
  associated_film: Optional[str] = None
  platform_links: Optional[Dict] = None
  tracklist: Optional[List[str]] = None
  review_count: Optional[int] = 0
  likes_count: Optional[int] = 0

class AlbumCreate(AlbumBase):
  id: str
  artist_ids: List[str]

class AlbumUpdate(BaseModel):
  title: Optional[str] = None
  title_lowercase: Optional[str] = None
  release_date: Optional[str] = None
  cover_art_url: Optional[str] = None
  genre: Optional[str] = None
  associated_film: Optional[str] = None
  platform_links: Optional[Dict] = None
  tracklist: Optional[List[str]] = None
  artist_ids: Optional[List[str]] = None

class Album(AlbumBase):
  id: str
  artist_ids: Optional[List[str]] = None
  model_config = ConfigDict(from_attributes=True)

class SongBase(BaseModel):
  title: str
  title_lowercase: Optional[str] = None
  album_id: Optional[str] = None
  duration: int
  release_date: Optional[str] = None
  genre: Optional[str] = None
  credits: Optional[Dict] = None
  cover_art_url: Optional[str] = None
  platform_links: Optional[Dict] = None
  review_count: Optional[int] = 0
  likes_count: Optional[int] = 0

class SongCreate(SongBase):
  id: str
  artist_ids: List[str]

class SongUpdate(BaseModel):
  title: Optional[str] = None
  title_lowercase: Optional[str] = None
  album_id: Optional[str] = None
  duration: Optional[int] = None
  release_date: Optional[str] = None
  genre: Optional[str] = None
  credits: Optional[Dict] = None
  cover_art_url: Optional[str] = None
  platform_links: Optional[Dict] = None
  artist_ids: Optional[List[str]] = None

class Song(SongBase):
  id: str
  artist_ids: Optional[List[str]] = None
  model_config = ConfigDict(from_attributes=True)

class PlaylistBase(BaseModel):
  title: str
  description: Optional[str] = None
  cover_art_url: Optional[str] = None
  created_at: Optional[datetime] = None
  updated_at: Optional[datetime] = None
  is_public: Optional[bool] = True
  platform_links: Optional[Dict] = None
  song_ids: Optional[List[str]] = None

class PlaylistCreate(PlaylistBase):
  id: str
  user_id: str

class PlaylistUpdate(BaseModel):
  title: Optional[str] = None
  description: Optional[str] = None
  cover_art_url: Optional[str] = None
  updated_at: Optional[datetime] = None
  is_public: Optional[bool] = None
  platform_links: Optional[Dict] = None
  song_ids: Optional[List[str]] = None

class Playlist(PlaylistBase):
  id: str
  user_id: str
  model_config = ConfigDict(from_attributes=True)

class ReviewBase(BaseModel):
  rating: int
  review_text: Optional[str] = None
  entity_id: str
  entity_type: str
  entity_title: Optional[str] = None
  entity_cover_art_url: Optional[str] = None
  entity_username: Optional[str] = None

class ReviewCreate(ReviewBase):
  id: str
  user_id: str
  song_id: Optional[str] = None

class ReviewUpdate(BaseModel):
  rating: Optional[int] = None
  review_text: Optional[str] = None

class Review(ReviewBase):
  id: str
  user_id: str
  created_at: datetime
  likes_count: Optional[int] = 0
  song_id: Optional[str] = None
  model_config = ConfigDict(from_attributes=True)

class LikeBase(BaseModel):
  entity_id: str
  entity_type: str
  entity_title: Optional[str] = None
  entity_cover_art_url: Optional[str] = None
  review_on_entity_type: Optional[str] = None
  review_on_entity_id: Optional[str] = None
  review_on_entity_title: Optional[str] = None

class LikeCreate(LikeBase):
  id: str
  user_id: str

class Like(LikeBase):
  id: str
  user_id: str
  created_at: datetime
  model_config = ConfigDict(from_attributes=True)

class FollowBase(BaseModel):
  created_at: Optional[datetime] = None

class FollowCreate(FollowBase):
  follower_id: str
  following_id: str

class Follow(FollowBase):
  follower_id: str
  following_id: str
  model_config = ConfigDict(from_attributes=True)