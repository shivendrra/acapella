import os, json, glob, sys
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("EXTERNAL_DATABASE_URL")

if not DATABASE_URL:
  print("[ERROR] DATABASE_URL not found in environment variables")
  sys.exit(1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
  db = SessionLocal()
  try:
    return db
  except Exception as e:
    print(f"[ERROR] Database connection failed: {e}")
    sys.exit(1)

def test_connection():
  try:
    db = get_db()
    result = db.execute(text("SELECT version();"))
    version = result.fetchone()[0]
    print(f" Connected to PostgreSQL: {version[:50]}...")
    db.close()
    return True
  except Exception as e:
    print(f" Connection failed: {e}")
    return False

def upload_artist(db, artist_data):
  try:
    query = text("""
      INSERT INTO artists (
        id, name, name_lowercase, image_url, cover_image_url,
        genres, bio, socials, platform_links
      ) VALUES (
        :id, :name, :name_lowercase, :image_url, :cover_image_url,
        :genres, :bio, :socials, :platform_links
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        name_lowercase = EXCLUDED.name_lowercase,
        image_url = EXCLUDED.image_url,
        cover_image_url = EXCLUDED.cover_image_url,
        genres = EXCLUDED.genres,
        bio = EXCLUDED.bio,
        socials = EXCLUDED.socials,
        platform_links = EXCLUDED.platform_links
    """)
    
    db.execute(query, {
      'id': artist_data.get('id'),
      'name': artist_data.get('name'),
      'name_lowercase': artist_data.get('name_lowercase'),
      'image_url': artist_data.get('imageUrl'),
      'cover_image_url': artist_data.get('coverImageUrl'),
      'genres': artist_data.get('genres', []),
      'bio': artist_data.get('bio'),
      'socials': json.dumps(artist_data.get('socials', {})),
      'platform_links': json.dumps(artist_data.get('platformLinks', {}))
    })
    db.commit()
    return True
  except Exception as e:
    db.rollback()
    print(f"    [ERROR] Artist upload failed: {e}")
    return False

def upload_album(db, album_data):
  try:
    query = text("""
      INSERT INTO albums (
        id, title, title_lowercase, release_date, cover_art_url,
        platform_links, tracklist, review_count, likes_count
      ) VALUES (
        :id, :title, :title_lowercase, :release_date, :cover_art_url,
        :platform_links, :tracklist, :review_count, :likes_count
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        title_lowercase = EXCLUDED.title_lowercase,
        release_date = EXCLUDED.release_date,
        cover_art_url = EXCLUDED.cover_art_url,
        platform_links = EXCLUDED.platform_links,
        tracklist = EXCLUDED.tracklist
    """)
    
    db.execute(query, {
      'id': album_data.get('id'),
      'title': album_data.get('title'),
      'title_lowercase': album_data.get('title_lowercase'),
      'release_date': album_data.get('releaseDate'),
      'cover_art_url': album_data.get('coverArtUrl'),
      'platform_links': json.dumps(album_data.get('platformLinks', {})),
      'tracklist': album_data.get('tracklist', []),
      'review_count': album_data.get('reviewCount', 0),
      'likes_count': album_data.get('likesCount', 0)
    })
    
    artist_ids = album_data.get('artistIds', [])
    for artist_id in artist_ids:
      try:
        link_query = text("""
          INSERT INTO album_artists (album_id, artist_id)
          VALUES (:album_id, :artist_id)
          ON CONFLICT (album_id, artist_id) DO NOTHING
        """)
        db.execute(link_query, {'album_id': album_data.get('id'), 'artist_id': artist_id})
      except Exception as e:
        print(f"      [WARN] Failed to link artist {artist_id}: {e}")
    
    db.commit()
    return True
  except Exception as e:
    db.rollback()
    print(f"    [ERROR] Album upload failed: {e}")
    return False

def upload_song(db, song_data):
  try:
    query = text("""
      INSERT INTO songs (
        id, title, title_lowercase, album_id, duration,
        release_date, genre, credits, cover_art_url,
        platform_links, review_count, likes_count
      ) VALUES (
        :id, :title, :title_lowercase, :album_id, :duration,
        :release_date, :genre, :credits, :cover_art_url,
        :platform_links, :review_count, :likes_count
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        title_lowercase = EXCLUDED.title_lowercase,
        album_id = EXCLUDED.album_id,
        duration = EXCLUDED.duration,
        release_date = EXCLUDED.release_date,
        genre = EXCLUDED.genre,
        credits = EXCLUDED.credits,
        cover_art_url = EXCLUDED.cover_art_url,
        platform_links = EXCLUDED.platform_links
    """)
    
    db.execute(query, {
      'id': song_data.get('id'),
      'title': song_data.get('title'),
      'title_lowercase': song_data.get('title_lowercase'),
      'album_id': song_data.get('albumId'),
      'duration': song_data.get('duration', 0),
      'release_date': song_data.get('releaseDate'),
      'genre': song_data.get('genre'),
      'credits': json.dumps(song_data.get('credits', {})),
      'cover_art_url': song_data.get('coverArtUrl'),
      'platform_links': json.dumps(song_data.get('platformLinks', {})),
      'review_count': song_data.get('reviewCount', 0),
      'likes_count': song_data.get('likesCount', 0)
    })
    
    artist_ids = song_data.get('artistIds', [])
    for artist_id in artist_ids:
      try:
        link_query = text("""
          INSERT INTO song_artists (song_id, artist_id)
          VALUES (:song_id, :artist_id)
          ON CONFLICT (song_id, artist_id) DO NOTHING
        """)
        db.execute(link_query, {'song_id': song_data.get('id'), 'artist_id': artist_id})
      except Exception as e:
        print(f"      [WARN] Failed to link artist {artist_id}: {e}")
    
    db.commit()
    return True
  except Exception as e:
    db.rollback()
    print(f"    [ERROR] Song upload failed: {e}")
    return False

def upload_artist_data(json_file_path):
  print(f"\n=== Uploading: {os.path.basename(json_file_path)} ===")
  
  with open(json_file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)
  
  artist_data = data.get('artist')
  albums_data = data.get('albums', [])
  tracks_data = data.get('tracks', [])
  
  if not artist_data:
    print("  [ERROR] No artist data found")
    return False
  
  artist_id = artist_data.get('id')
  if not artist_id:
    print("  [ERROR] Artist ID missing")
    return False
  
  db = get_db()
  
  try:
    print(f"  Uploading artist: {artist_data.get('name')}")
    if not upload_artist(db, artist_data):
      return False
    print(f"    [OK] Artist uploaded")
    
    print(f"  Uploading {len(albums_data)} albums...")
    album_success = 0
    for idx, album in enumerate(albums_data, 1):
      album_id = album.get('id')
      if not album_id:
        print(f"    [SKIP] Album {idx}: Missing ID")
        continue
      
      if upload_album(db, album):
        album_success += 1
      
      if idx % 5 == 0 or idx == len(albums_data):
        print(f"    Progress: {album_success}/{idx}")
    
    print(f"    [OK] {album_success}/{len(albums_data)} albums uploaded")
    
    print(f"  Uploading {len(tracks_data)} tracks...")
    track_success = 0
    for idx, track in enumerate(tracks_data, 1):
      track_id = track.get('id')
      if not track_id:
        print(f"    [SKIP] Track {idx}: Missing ID")
        continue
      
      if upload_song(db, track):
        track_success += 1
      
      if idx % 20 == 0 or idx == len(tracks_data):
        print(f"    Progress: {track_success}/{idx}")
    
    print(f"    [OK] {track_success}/{len(tracks_data)} tracks uploaded")
    print(f"  [SUCCESS] Upload complete!")
    
    return True
  
  except Exception as e:
    print(f"  [ERROR] Upload failed: {str(e)}")
    return False
  finally:
    db.close()

def upload_all_json_files(directory_path="../fetched/"):
  if not os.path.exists(directory_path):
    print(f"[ERROR] Directory not found: {directory_path}")
    return
  
  json_files = glob.glob(os.path.join(directory_path, "*.json"))
  
  if not json_files:
    print(f"[ERROR] No JSON files found in {directory_path}")
    return
  
  print(f"\n{'='*60}")
  print(f"PostgreSQL Data Upload Script")
  print(f"{'='*60}")
  print(f"Found {len(json_files)} JSON files to upload")
  print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'N/A'}")
  print(f"{'='*60}\n")
  
  success_count, fail_count = 0, 0
  
  for json_file in json_files:
    if upload_artist_data(json_file):
      success_count += 1
    else:
      fail_count += 1
  
  print(f"\n{'='*60}")
  print(f"Upload Summary:")
  print(f"  Total files: {len(json_files)}")
  print(f"  [/] Successful: {success_count}")
  print(f"  [X] Failed: {fail_count}")
  print(f"  Success rate: {(success_count/len(json_files)*100):.1f}%")
  print(f"{'='*60}")

def upload_single_file(json_file_path):
  if not os.path.exists(json_file_path):
    print(f"[ERROR] File not found: {json_file_path}")
    return
  
  print(f"\n{'='*60}")
  print(f"PostgreSQL Single File Upload")
  print(f"{'='*60}")
  
  if not test_connection():
    return
  
  success = upload_artist_data(json_file_path)
  
  if success:
    print(f"\n[/] Successfully uploaded: {os.path.basename(json_file_path)}")
  else:
    print(f"\n[X] Failed to upload: {os.path.basename(json_file_path)}")

def verify_upload():
  try:
    db = get_db()
    
    result = db.execute(text("SELECT COUNT(*) FROM artists"))
    artist_count = result.fetchone()[0]
    
    result = db.execute(text("SELECT COUNT(*) FROM albums"))
    album_count = result.fetchone()[0]
    
    result = db.execute(text("SELECT COUNT(*) FROM songs"))
    song_count = result.fetchone()[0]
    
    print(f"\n{'='*60}")
    print(f"Database Statistics:")
    print(f"  - Artists: {artist_count}")
    print(f"  - Albums: {album_count}")
    print(f"  - Songs: {song_count}")
    print(f"{'='*60}\n")
    
    result = db.execute(text("""
      SELECT a.name, COUNT(DISTINCT al.id) as albums, COUNT(DISTINCT s.id) as songs
      FROM artists a
      LEFT JOIN album_artists aa ON a.id = aa.artist_id
      LEFT JOIN albums al ON aa.album_id = al.id
      LEFT JOIN song_artists sa ON a.id = sa.artist_id
      LEFT JOIN songs s ON sa.song_id = s.id
      GROUP BY a.id, a.name
      ORDER BY songs DESC
      LIMIT 5
    """))
    
    print("Top 5 Artists by song count:")
    for row in result:
      print(f"  - {row[0]}: {row[1]} albums, {row[2]} songs")
    
    db.close()
  except Exception as e:
    print(f"[ERROR] Verification failed: {e}")

if __name__ == "__main__":
  import argparse
  
  parser = argparse.ArgumentParser(description='Upload artist data to PostgreSQL')
  parser.add_argument('--file', type=str, help='Upload single JSON file')
  parser.add_argument('--dir', type=str, default='../fetched/', help='Directory with JSON files')
  parser.add_argument('--test', action='store_true', help='Test database connection')
  parser.add_argument('--verify', action='store_true', help='Verify uploaded data')
  
  args = parser.parse_args()
  
  if args.test:
    test_connection()
  elif args.verify:
    verify_upload()
  elif args.file:
    if not test_connection():
      sys.exit(1)
    upload_single_file(args.file)
  else:
    if not test_connection():
      sys.exit(1)
    upload_all_json_files(args.dir)