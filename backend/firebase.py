import firebase_admin
from firebase_admin import credentials
from .core.config import settings
import os

def init_firebase():
  if not firebase_admin._apps:
    if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
      cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
      firebase_admin.initialize_app(cred)
    else: print(f"Warning: Firebase credentials not found at {settings.FIREBASE_CREDENTIALS_PATH}")