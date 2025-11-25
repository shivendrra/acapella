from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from datetime import datetime, timezone
from ..database import Base

playlist_songs = Table(
  "playlist_songs",
  Base.metadata,
  Column("playlist_id", String, ForeignKey("playlists.id"), primary_key=True),
  Column("song_id", String, ForeignKey("songs.id"), primary_key=True)
)

song_artists = Table(
  "song_artists",
  Base.metadata,
  Column("song_id", String, ForeignKey("songs.id"), primary_key=True),
  Column("artist_id", String, ForeignKey("artists.id"), primary_key=True)
)

album_artists = Table(
  "album_artists",
  Base.metadata,
  Column("album_id", String, ForeignKey("albums.id"), primary_key=True),
  Column("artist_id", String, ForeignKey("artists.id"), primary_key=True)
)

class Artist(Base):
  __tablename__ = "artists"

  id = Column(String, primary_key=True)
  name = Column(String, nullable=False)
  name_lowercase = Column(String)
  image_url = Column(String)
  cover_image_url = Column(String)
  genres = Column(ARRAY(String))
  bio = Column(Text)
  socials = Column(JSONB)
  platform_links = Column(JSONB)

  songs = relationship("Song", secondary=song_artists, back_populates="artists")
  albums = relationship("Album", secondary=album_artists, back_populates="artists")

class Album(Base):
  __tablename__ = "albums"

  id = Column(String, primary_key=True)
  title = Column(String, nullable=False)
  title_lowercase = Column(String)
  release_date = Column(String)
  cover_art_url = Column(String)
  genre = Column(String)
  associated_film = Column(String)
  platform_links = Column(JSONB)
  review_count = Column(Integer, default=0)
  likes_count = Column(Integer, default=0)

  tracklist = Column(ARRAY(String))

  artists = relationship("Artist", secondary=album_artists, back_populates="albums")
  songs = relationship("Song", back_populates="album")

class Song(Base):
  __tablename__ = "songs"

  id = Column(String, primary_key=True)
  title = Column(String, nullable=False)
  title_lowercase = Column(String)
  album_id = Column(String, ForeignKey("albums.id"))
  duration = Column(Integer, nullable=False)
  release_date = Column(String)
  genre = Column(String)
  credits = Column(JSONB)
  cover_art_url = Column(String)
  platform_links = Column(JSONB)
  review_count = Column(Integer, default=0)
  likes_count = Column(Integer, default=0)

  album = relationship("Album", back_populates="songs")
  artists = relationship("Artist", secondary=song_artists, back_populates="songs")
  reviews = relationship("Review", back_populates="song")

class Playlist(Base):
  __tablename__ = "playlists"

  id = Column(String, primary_key=True)
  user_id = Column(String, ForeignKey("users.id"))
  title = Column(String, nullable=False)
  description = Column(Text)
  cover_art_url = Column(String)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
  updated_at = Column(DateTime)
  is_public = Column(Boolean)
  platform_links = Column(JSONB)

  user = relationship("User", back_populates="playlists")
  songs = relationship("Song", secondary=playlist_songs)

class Review(Base):
  __tablename__ = "reviews"

  id = Column(String, primary_key=True)
  user_id = Column(String, ForeignKey("users.id"))
  rating = Column(Integer, nullable=False)
  review_text = Column(Text)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
  likes_count = Column(Integer, default=0)

  entity_id = Column(String)
  entity_type = Column(String)
  entity_title = Column(String)
  entity_cover_art_url = Column(String)
  entity_username = Column(String)

  user = relationship("User", back_populates="reviews")
  song_id = Column(String, ForeignKey("songs.id"))
  song = relationship("Song", back_populates="reviews")

class Like(Base):
  __tablename__ = "likes"

  id = Column(String, primary_key=True)
  user_id = Column(String, ForeignKey("users.id"))
  entity_id = Column(String)
  entity_type = Column(String)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
  entity_title = Column(String)
  entity_cover_art_url = Column(String)
  review_on_entity_type = Column(String)
  review_on_entity_id = Column(String)
  review_on_entity_title = Column(String)

  user = relationship("User", back_populates="likes")