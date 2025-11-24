import os, json, glob
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("../serviceaccountsecret.json")
firebase_admin.initialize_app(cred)

db = firestore.client()