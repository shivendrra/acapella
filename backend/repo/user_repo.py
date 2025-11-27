from ..models.user import User, UserProfile
from sqlalchemy.orm import Session
from ..core.security import hash_password

def get_user_by_id(db: Session, user_id: str):
  return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
  return db.query(User).filter(User.email == email).first()

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