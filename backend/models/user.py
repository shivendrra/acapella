from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from datetime import datetime, timezone
from ..database import Base

class User(Base):
  __tablename__ = "users"

  id = Column(String, primary_key=True)
  email = Column(String, unique=True)
  password_hash = Column(String)
  role = Column(String, nullable=False, default="user")
  created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

  profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
  playlists = relationship("Playlist", back_populates="user", cascade="all, delete-orphan")
  reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
  likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
  followers = relationship("Follow", foreign_keys="Follow.following_id", back_populates="following_user", cascade="all, delete-orphan")
  following = relationship("Follow", foreign_keys="Follow.follower_id", back_populates="follower_user", cascade="all, delete-orphan")

class UserProfile(Base):
  __tablename__ = "user_profiles"

  user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
  username = Column(String, unique=True, nullable=False)
  display_name = Column(String)
  photo_url = Column(String)
  is_curator = Column(Boolean, default=False)
  bio = Column(Text)
  profile_complete = Column(Boolean, default=False)
  linked_accounts = Column(JSONB)
  socials = Column(JSONB)
  followers_count = Column(Integer, default=0)
  following_count = Column(Integer, default=0)
  favorite_song_ids = Column(ARRAY(String))
  favorite_album_ids = Column(ARRAY(String))

  user = relationship("User", back_populates="profile")

class Follow(Base):
  __tablename__ = "follows"

  follower_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
  following_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
  created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

  follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
  following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")

class AdminApplication(Base):
  __tablename__ = "admin_applications"

  id = Column(String, primary_key=True)
  user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
  user_email = Column(String)
  user_name = Column(String)
  reason = Column(Text)
  status = Column(String, default="pending")
  submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))