import os, json, glob
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("../serviceaccountsecret.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

def upload_artist_data(json_file_path):
  print(f"\n=== Uploading: {os.path.basename(json_file_path)} ===")
  with open(json_file_path, 'r', encoding='utf-8') as f: data = json.load(f)

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

  try:
    print(f"  Uploading artist: {artist_data.get('name')}")
    db.collection('artists').document(artist_id).set({
      'id': artist_data.get('id'),
      'name': artist_data.get('name'),
      'name_lowercase': artist_data.get('name_lowercase'),
      'imageUrl': artist_data.get('imageUrl') or '',
      'coverImageUrl': artist_data.get('coverImageUrl') or '',
      'genres': artist_data.get('genres', []),
      'bio': artist_data.get('bio') or '',
      'socials': artist_data.get('socials', {}),
      'platformLinks': artist_data.get('platformLinks', {}),
    })
    print(f"    [OK] Artist uploaded")

    print(f"  Uploading {len(albums_data)} albums...")
    for idx, album in enumerate(albums_data, 1):
      album_id = album.get('id')
      if not album_id:
        print(f"    [SKIP] Album {idx}: Missing ID")
        continue

      db.collection('albums').document(album_id).set({
        'id': album.get('id'),
        'title': album.get('title'),
        'title_lowercase': album.get('title_lowercase'),
        'artistIds': album.get('artistIds', []),
        'releaseDate': album.get('releaseDate') or '',
        'coverArtUrl': album.get('coverArtUrl') or '',
        'tracklist': album.get('tracklist', []),
        'platformLinks': album.get('platformLinks', {}),
        'reviewCount': album.get('reviewCount', 0),
        'likesCount': album.get('likesCount', 0),
      })
      if idx % 5 == 0 or idx == len(albums_data): print(f"    Progress: {idx}/{len(albums_data)}")

    print(f"    [OK] All albums uploaded")

    print(f"  Uploading {len(tracks_data)} tracks...")
    for idx, track in enumerate(tracks_data, 1):
      track_id = track.get('id')
      if not track_id:
        print(f"    [SKIP] Track {idx}: Missing ID")
        continue

      db.collection('songs').document(track_id).set({
        'id': track.get('id'),
        'title': track.get('title'),
        'title_lowercase': track.get('title_lowercase'),
        'artistIds': track.get('artistIds', []),
        'albumId': track.get('albumId') or '',
        'duration': track.get('duration', 0),
        'releaseDate': track.get('releaseDate') or '',
        'genre': track.get('genre') or '',
        'credits': track.get('credits', {}),
        'coverArtUrl': track.get('coverArtUrl') or '',
        'platformLinks': track.get('platformLinks', {}),
        'reviewCount': track.get('reviewCount', 0),
        'likesCount': track.get('likesCount', 0),
      })
      if idx % 20 == 0 or idx == len(tracks_data): print(f"    Progress: {idx}/{len(tracks_data)}")
    print(f"    [OK] All tracks uploaded")
    print(f"  [SUCCESS] Upload complete!")
    return True

  except Exception as e:
    print(f"  [ERROR] Upload failed: {str(e)}")
    return False

def upload_all_json_files(directory_path="../fetched/"):
  if not os.path.exists(directory_path):
    print(f"[ERROR] Directory not found: {directory_path}")
    return

  json_files = glob.glob(os.path.join(directory_path, "*.json"))
  if not json_files:
    print(f"[ERROR] No JSON files found in {directory_path}")
    return

  print(f"\nFound {len(json_files)} JSON files to upload")
  success_count, fail_count = 0, 0

  for json_file in json_files:
    if upload_artist_data(json_file): success_count += 1
    else: fail_count += 1
  print(f"\n{'='*50}")
  print(f"Upload Summary:")
  print(f"  Total files: {len(json_files)}")
  print(f"  Successful: {success_count}")
  print(f"  Failed: {fail_count}")
  print(f"{'='*50}")

if __name__ == "__main__":
  upload_all_json_files()