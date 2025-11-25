from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from ..database import Base

class User(Base):
  __tablename__ = "users"

  id = Column(Integer, primary_key=True, index=True)
  username = Column(String(50), unique=True, nullable=False)
  email = Column(String(255), unique=True, nullable=False)
  password_hash = Column(Text, nullable=False)
  bio = Column(Text)
  role = Column(String(20), default="standard")
  created_at = Column(DateTime, server_default=func.now())
  updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())