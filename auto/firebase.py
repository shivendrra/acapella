import firebase_admin
from firebase_admin import credentials, db

firebasedb_url = "https://allepacaeht.firebaseio.com"

cred = credentials.Certificate("../serviceaccountsecret.json")
firebase_admin.initialize_app(cred, { 'databaseURL': firebasedb_url })
