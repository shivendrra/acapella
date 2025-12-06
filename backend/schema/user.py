from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, List

class UserBase(BaseModel):
  email: Optional[str] = None
  role: str

class UserCreate(UserBase):
  id: str

class UserUpdate(BaseModel):
  email: Optional[str] = None
  role: Optional[str] = None

class UserProfileBase(BaseModel):
  username: str
  display_name: Optional[str] = None
  photo_url: Optional[str] = None
  is_curator: Optional[bool] = False
  bio: Optional[str] = None
  profile_complete: Optional[bool] = False
  linked_accounts: Optional[Dict] = None
  socials: Optional[Dict] = None
  followers_count: Optional[int] = 0
  following_count: Optional[int] = 0
  favorite_song_ids: Optional[List[str]] = None
  favorite_album_ids: Optional[List[str]] = None

class UserProfileCreate(UserProfileBase):
  user_id: str

class UserProfileUpdate(BaseModel):
  username: Optional[str] = None
  display_name: Optional[str] = None
  photo_url: Optional[str] = None
  is_curator: Optional[bool] = None
  bio: Optional[str] = None
  profile_complete: Optional[bool] = None
  linked_accounts: Optional[Dict] = None
  socials: Optional[Dict] = None
  favorite_song_ids: Optional[List[str]] = None
  favorite_album_ids: Optional[List[str]] = None

class UserProfile(UserProfileBase):
  user_id: str
  model_config = ConfigDict(from_attributes=True)

class User(UserBase):
  id: str
  created_at: datetime
  profile: Optional[UserProfile] = None
  model_config = ConfigDict(from_attributes=True)

class AdminApplicationBase(BaseModel):
  user_id: str
  user_email: str
  user_name: Optional[str] = None
  reason: str
  status: str

class AdminApplicationCreate(AdminApplicationBase):
  id: str

class AdminApplication(AdminApplicationBase):
  id: str
  submitted_at: datetime
  model_config = ConfigDict(from_attributes=True)