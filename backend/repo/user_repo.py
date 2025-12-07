from sqlalchemy.orm import Session, joinedload
from ..models import User, UserProfile, Follow
from ..core.security import hash_password

def get_user_by_id(db: Session, user_id: str):
  return db.query(User).options(joinedload(User.profile)).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
  return db.query(User).options(joinedload(User.profile)).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str):
  profile = db.query(UserProfile).filter(UserProfile.username == username).first()
  return db.query(User).options(joinedload(User.profile)).filter(User.id == profile.user_id).first() if profile else None

def create_user(db: Session, id: str, email: str = None, role: str = "user", **profile_kwargs):
  user = User(id=id, email=email, role=role)
  db.add(user)
  db.flush()
  profile = UserProfile(user_id=id, **profile_kwargs)
  db.add(profile)
  db.commit()
  db.refresh(user)
  return user

def create_user_with_password(db: Session, id: str, email: str, password: str, **profile_kwargs):
  hashed = hash_password(password)
  user = User(id=id, email=email, role="user", password_hash=hashed)
  db.add(user)
  db.flush()
  profile = UserProfile(user_id=id, **profile_kwargs)
  db.add(profile)
  db.commit()
  db.refresh(user)
  return user

def update_user(db: Session, user_id: str, **kwargs):
  user = get_user_by_id(db, user_id)
  if not user: return None
  for key, value in kwargs.items():
    if hasattr(user, key): setattr(user, key, value)
  db.commit()
  db.refresh(user)
  return user

def update_user_profile(db: Session, user_id: str, **kwargs):
  profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
  if not profile: return None
  for key, value in kwargs.items():
    if hasattr(profile, key): setattr(profile, key, value)
  db.commit()
  db.refresh(profile)
  return profile

def delete_user(db: Session, user_id: str):
  user = get_user_by_id(db, user_id)
  if not user: return False
  db.delete(user)
  db.commit()
  return True

def follow_user(db: Session, follower_id: str, following_id: str):
  if follower_id == following_id: return None
  existing = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
  if existing: return existing
  follow = Follow(follower_id=follower_id, following_id=following_id)
  db.add(follow)
  follower_profile = db.query(UserProfile).filter(UserProfile.user_id == follower_id).first()
  following_profile = db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
  if follower_profile: follower_profile.following_count += 1
  if following_profile: following_profile.followers_count += 1
  db.commit()
  db.refresh(follow)
  return follow

def unfollow_user(db: Session, follower_id: str, following_id: str):
  follow = db.query(Follow).filter(Follow.follower_id == follower_id, Follow.following_id == following_id).first()
  if not follow: return False
  db.delete(follow)
  follower_profile = db.query(UserProfile).filter(UserProfile.user_id == follower_id).first()
  following_profile = db.query(UserProfile).filter(UserProfile.user_id == following_id).first()
  if follower_profile: follower_profile.following_count = max(0, follower_profile.following_count - 1)
  if following_profile: following_profile.followers_count = max(0, following_profile.followers_count - 1)
  db.commit()
  return True

def get_followers(db: Session, user_id: str, skip: int = 0, limit: int = 50):
  return db.query(Follow).filter(Follow.following_id == user_id).offset(skip).limit(limit).all()

def get_following(db: Session, user_id: str, skip: int = 0, limit: int = 50):
  return db.query(Follow).filter(Follow.follower_id == user_id).offset(skip).limit(limit).all()