import firebase_admin
from firebase_admin import credentials, auth

cred = credentials.Certificate("../../serviceaccountsecret.json")
firebase_admin.initialize_app(cred)

def verify_firebase_token(id_token: str):
  try: return auth.verify_id_token(id_token)
  except: return None