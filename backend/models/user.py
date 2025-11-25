from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from datetime import datetime, timezone
from ..database import Base

class User(Base):
  __tablename__ = "users"

  id = Column(String, primary_key=True)
  email = Column(String)
  role = Column(String, nullable=False)
  created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

  profile = relationship("UserProfile", back_populates="user", uselist=False)
  playlists = relationship("Playlist", back_populates="user")
  reviews = relationship("Review", back_populates="user")
  likes = relationship("Like", back_populates="user")
  followers = relationship("Follow", foreign_keys="Follow.following_id")
  following = relationship("Follow", foreign_keys="Follow.follower_id")

class UserProfile(Base):
  __tablename__ = "user_profiles"

  user_id = Column(String, ForeignKey("users.id"), primary_key=True)
  username = Column(String, unique=True, nullable=False)
  display_name = Column(String)
  photo_url = Column(String)
  is_curator = Column(Boolean)
  bio = Column(Text)
  profile_complete = Column(Boolean)
  linked_accounts = Column(JSONB)
  socials = Column(JSONB)
  followers_count = Column(Integer, default=0)
  following_count = Column(Integer, default=0)
  favorite_song_ids = Column(ARRAY(String))
  favorite_album_ids = Column(ARRAY(String))

  user = relationship("User", back_populates="profile")

# not creating the second "profile" table since it's too much overhead for server
# to handle, implement profile fields in the "user" tbale itself

class Follow(Base):
  __tablename__ = "follows"

  follower_id = Column(String, ForeignKey("users.id"), primary_key=True)
  following_id = Column(String, ForeignKey("users.id"), primary_key=True)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AdminApplication(Base):
  __tablename__ = "admin_applications"

  id = Column(String, primary_key=True)
  user_id = Column(String, ForeignKey("users.id"))
  user_email = Column(String)
  user_name = Column(String)
  reason = Column(Text)
  status = Column(String)
  submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))