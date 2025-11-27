import firebase_admin
from firebase_admin import credentials, auth
from core.config import settings

def init_firebase():
  if settings.FIREBASE_CREDENTIALS_PATH:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)