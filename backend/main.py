from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from .firebase import init_firebase
from .routes import auth_firebase, auth_local, auth_refresh, users
# from .routes import artists, albums, songs, playlists, reviews, likes, users, follows
from .routes import review, playlist, follow, likes, users

@asynccontextmanager
async def lifespan(app: FastAPI):
  Base.metadata.create_all(bind=engine)
  init_firebase()
  yield

app = FastAPI(title="Acapella API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(auth_firebase.router, tags=["Auth"])
app.include_router(auth_local.router, tags=["Auth"])
app.include_router(auth_refresh.router, tags=["Auth"])
# app.include_router(artists.router, tags=["Artists"])
# app.include_router(albums.router, tags=["Albums"])
# app.include_router(songs.router, tags=["Songs"])
app.include_router(playlist.router, tags=["Playlists"])
app.include_router(review.router, tags=["Reviews"])
app.include_router(likes.router, tags=["Likes"])
app.include_router(users.router, tags=["Users"])
app.include_router(follow.router, tags=["Follows"])

@app.get("/")
def root():
  return {"message": "Acapella API", "version": "1.0.0"}

@app.get("/health")
def health():
  return {"status": "healthy"}