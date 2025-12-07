from sqlalchemy.orm import Session, joinedload
from ..models import Artist, Album, Song, Playlist, Review, Like
from typing import List

def get_artist(db: Session, artist_id: str):
  return db.query(Artist).filter(Artist.id == artist_id).first()

def get_artists(db: Session, skip: int = 0, limit: int = 50):
  return db.query(Artist).offset(skip).limit(limit).all()

def create_artist(db: Session, **kwargs):
  artist = Artist(**kwargs)
  db.add(artist)
  db.commit()
  db.refresh(artist)
  return artist

def update_artist(db: Session, artist_id: str, **kwargs):
  artist = get_artist(db, artist_id)
  if not artist: return None
  for key, value in kwargs.items():
    if hasattr(artist, key): setattr(artist, key, value)
  db.commit()
  db.refresh(artist)
  return artist

def delete_artist(db: Session, artist_id: str):
  artist = get_artist(db, artist_id)
  if not artist: return False
  db.delete(artist)
  db.commit()
  return True

def get_album(db: Session, album_id: str):
  return db.query(Album).options(joinedload(Album.artists)).filter(Album.id == album_id).first()

def get_albums(db: Session, skip: int = 0, limit: int = 50):
  return db.query(Album).options(joinedload(Album.artists)).offset(skip).limit(limit).all()

def create_album(db: Session, artist_ids: List[str] = None, **kwargs):
  album = Album(**kwargs)
  if artist_ids:
    artists = db.query(Artist).filter(Artist.id.in_(artist_ids)).all()
    album.artists = artists
  db.add(album)
  db.commit()
  db.refresh(album)
  return album

def update_album(db: Session, album_id: str, artist_ids: List[str] = None, **kwargs):
  album = get_album(db, album_id)
  if not album: return None
  for key, value in kwargs.items():
    if key != "artist_ids" and hasattr(album, key): setattr(album, key, value)
  if artist_ids is not None:
    artists = db.query(Artist).filter(Artist.id.in_(artist_ids)).all()
    album.artists = artists
  db.commit()
  db.refresh(album)
  return album

def delete_album(db: Session, album_id: str):
  album = get_album(db, album_id)
  if not album: return False
  db.delete(album)
  db.commit()
  return True

def get_song(db: Session, song_id: str):
  return db.query(Song).options(joinedload(Song.artists), joinedload(Song.album)).filter(Song.id == song_id).first()

def get_songs(db: Session, skip: int = 0, limit: int = 50):
  return db.query(Song).options(joinedload(Song.artists)).offset(skip).limit(limit).all()

def create_song(db: Session, artist_ids: List[str] = None, **kwargs):
  song = Song(**kwargs)
  if artist_ids:
    artists = db.query(Artist).filter(Artist.id.in_(artist_ids)).all()
    song.artists = artists
  db.add(song)
  db.commit()
  db.refresh(song)
  return song

def update_song(db: Session, song_id: str, artist_ids: List[str] = None, **kwargs):
  song = get_song(db, song_id)
  if not song: return None
  for key, value in kwargs.items():
    if key != "artist_ids" and hasattr(song, key): setattr(song, key, value)
  if artist_ids is not None:
    artists = db.query(Artist).filter(Artist.id.in_(artist_ids)).all()
    song.artists = artists
  db.commit()
  db.refresh(song)
  return song

def delete_song(db: Session, song_id: str):
  song = get_song(db, song_id)
  if not song: return False
  db.delete(song)
  db.commit()
  return True

def get_playlist(db: Session, playlist_id: str):
  return db.query(Playlist).options(joinedload(Playlist.songs)).filter(Playlist.id == playlist_id).first()

def get_playlists_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 50):
  return db.query(Playlist).filter(Playlist.user_id == user_id).offset(skip).limit(limit).all()

def create_playlist(db: Session, song_ids: List[str] = None, **kwargs):
  playlist = Playlist(**kwargs)
  if song_ids:
    songs = db.query(Song).filter(Song.id.in_(song_ids)).all()
    playlist.songs = songs
  db.add(playlist)
  db.commit()
  db.refresh(playlist)
  return playlist

def update_playlist(db: Session, playlist_id: str, song_ids: List[str] = None, **kwargs):
  playlist = get_playlist(db, playlist_id)
  if not playlist: return None
  for key, value in kwargs.items():
    if key != "song_ids" and hasattr(playlist, key): setattr(playlist, key, value)
  if song_ids is not None:
    songs = db.query(Song).filter(Song.id.in_(song_ids)).all()
    playlist.songs = songs
  db.commit()
  db.refresh(playlist)
  return playlist

def delete_playlist(db: Session, playlist_id: str):
  playlist = get_playlist(db, playlist_id)
  if not playlist: return False
  db.delete(playlist)
  db.commit()
  return True

def get_review(db: Session, review_id: str):
  return db.query(Review).filter(Review.id == review_id).first()

def get_reviews_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 50):
  return db.query(Review).filter(Review.user_id == user_id).offset(skip).limit(limit).all()

def get_reviews_by_entity(db: Session, entity_id: str, entity_type: str, skip: int = 0, limit: int = 50):
  return db.query(Review).filter(Review.entity_id == entity_id, Review.entity_type == entity_type).offset(skip).limit(limit).all()

def create_review(db: Session, **kwargs):
  review = Review(**kwargs)
  db.add(review)
  entity_type = kwargs.get("entity_type")
  entity_id = kwargs.get("entity_id")
  if entity_type == "song":
    song = db.query(Song).filter(Song.id == entity_id).first()
    if song: song.review_count += 1
  elif entity_type == "album":
    album = db.query(Album).filter(Album.id == entity_id).first()
    if album: album.review_count += 1
  db.commit()
  db.refresh(review)
  return review

def update_review(db: Session, review_id: str, **kwargs):
  review = get_review(db, review_id)
  if not review: return None
  for key, value in kwargs.items():
    if hasattr(review, key): setattr(review, key, value)
  db.commit()
  db.refresh(review)
  return review

def delete_review(db: Session, review_id: str):
  review = get_review(db, review_id)
  if not review: return False
  entity_type, entity_id = review.entity_type, review.entity_id
  db.delete(review)
  if entity_type == "song":
    song = db.query(Song).filter(Song.id == entity_id).first()
    if song: song.review_count = max(0, song.review_count - 1)
  elif entity_type == "album":
    album = db.query(Album).filter(Album.id == entity_id).first()
    if album: album.review_count = max(0, album.review_count - 1)
  db.commit()
  return True

def get_like(db: Session, user_id: str, entity_id: str, entity_type: str):
  return db.query(Like).filter(Like.user_id == user_id, Like.entity_id == entity_id, Like.entity_type == entity_type).first()

def get_likes_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 50):
  return db.query(Like).filter(Like.user_id == user_id).offset(skip).limit(limit).all()

def create_like(db: Session, **kwargs):
  like = Like(**kwargs)
  db.add(like)
  entity_type = kwargs.get("entity_type")
  entity_id = kwargs.get("entity_id")
  if entity_type == "song":
    song = db.query(Song).filter(Song.id == entity_id).first()
    if song: song.likes_count += 1
  elif entity_type == "album":
    album = db.query(Album).filter(Album.id == entity_id).first()
    if album: album.likes_count += 1
  elif entity_type == "review":
    review = db.query(Review).filter(Review.id == entity_id).first()
    if review: review.likes_count += 1
  db.commit()
  db.refresh(like)
  return like

def delete_like(db: Session, like_id: str):
  like = db.query(Like).filter(Like.id == like_id).first()
  if not like: return False
  entity_type, entity_id = like.entity_type, like.entity_id
  db.delete(like)
  if entity_type == "song":
    song = db.query(Song).filter(Song.id == entity_id).first()
    if song: song.likes_count = max(0, song.likes_count - 1)
  elif entity_type == "album":
    album = db.query(Album).filter(Album.id == entity_id).first()
    if album: album.likes_count = max(0, album.likes_count - 1)
  elif entity_type == "review":
    review = db.query(Review).filter(Review.id == entity_id).first()
    if review: review.likes_count = max(0, review.likes_count - 1)
  db.commit()
  return True