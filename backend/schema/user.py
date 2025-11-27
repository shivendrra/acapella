from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Annotated, Dict, List

class UserBase(BaseModel):
  email: Optional[str]
  role: str

class UserCreate(UserBase):
  id: str

class UserUpdate(BaseModel):
  email: Optional[str]
  role: Optional[str]

class User(UserBase):
  id: str
  created_at: datetime

  class Config:
    orm_mode = True

class UserProfileBase(BaseModel):
  username: str
  display_name: Optional[str]
  photo_url: Optional[str]
  is_curator: Optional[bool]
  bio: Optional[str]
  profile_complete: Optional[bool]
  linked_accounts: Optional[Dict]
  socials: Optional[Dict]
  followers_count: Optional[int]
  following_count: Optional[int]
  favorite_song_ids: Optional[List[str]]
  favorite_album_ids: Optional[List[str]]

class UserProfileCreate(UserProfileBase):
  user_id: str

class UserProfileUpdate(BaseModel):
  username: Optional[str]
  display_name: Optional[str]
  photo_url: Optional[str]
  is_curator: Optional[bool]
  bio: Optional[str]
  profile_complete: Optional[bool]
  linked_accounts: Optional[Dict]
  socials: Optional[Dict]
  favorite_song_ids: Optional[List[str]]
  favorite_album_ids: Optional[List[str]]

class UserProfile(UserProfileBase):
  user_id: str

  class Config:
    orm_mode = True

class AdminApplicationBase(BaseModel):
  user_id: str
  user_email: str
  user_name: Optional[str]
  reason: str
  status: str

class AdminApplicationCreate(AdminApplicationBase):
  id: str

class AdminApplication(AdminApplicationBase):
  id: str
  submitted_at: datetime

  class Config:
    orm_mode = True