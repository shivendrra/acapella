import requests, os, time, json
from datetime import datetime, timezone
from musicbrainz import fetch_artist_img, search_musicbrainz, lookup_musicbrainz, MUSICBRAINZ_BASE, AUDIODB_BASE
from search import google_search, search_images, get_best_image

headers = {
  'User-Agent': 'Acapella/1.0 (shivharsh44@gmail.com)',
  'Accept': 'application/json'
}

OUTPUT_DIR = "../fetched/"

def safe_request(url, max_retries=3, **kwargs):
  for attempt in range(max_retries):
    try:
      resp = requests.get(url, timeout=15, **kwargs)
      resp.raise_for_status()
      return resp
    except (requests.exceptions.ConnectionError, requests.exceptions.Timeout, requests.exceptions.ChunkedEncodingError) as e:
      if attempt < max_retries - 1:
        wait_time = 2 ** attempt
        print(f"  Retry {attempt + 1}/{max_retries} after {wait_time}s...")
        time.sleep(wait_time)
      else:
        raise e
    except requests.exceptions.HTTPError as e:
      raise e

def process_artist(artist_name: str):
  print(f"\n=== Processing Artist: {artist_name} ===")
  result = search_musicbrainz(artist_name)
  if not result:
    print(f'Artist not found: {artist_name}')
    return None

  mbid = result['id']
  print(f"Found artist: {result.get('name')} (MBID: {mbid})")
  
  artist_data = lookup_musicbrainz(mbid)
  artist_obj = {
    'id': mbid,
    'name': artist_data.get('name'),
    'name_lowercase': artist_data.get('name', '').lower(),
    'imageUrl': None,
    'coverImageUrl': None,
    'genres': [],
    'bio': artist_data.get('disambiguation'),
    'socials': {},
    'platformLinks': {},
  }

  print("Fetching artist images...")
  images_info = fetch_artist_img(mbid)
  if images_info:
    artist_obj['imageUrl'] = images_info.get('strArtistThumb')
    wide = images_info.get('strArtistBanner') or images_info.get('strArtistFanart2')
    artist_obj['coverImageUrl'] = wide

  need_profile_fallback = not artist_obj['imageUrl']
  need_cover_fallback = not artist_obj['coverImageUrl']

  if need_profile_fallback:
    print("Searching for profile image fallback...")
    profile_fallback = get_best_image(f"{artist_name} portrait")
    if profile_fallback: artist_obj['imageUrl'] = profile_fallback

  if need_cover_fallback:
    print("Searching for cover image fallback...")
    cover_fallback = get_best_image(f"{artist_name} banner")
    if cover_fallback: artist_obj['coverImageUrl'] = cover_fallback

  release_groups = artist_data.get('release-groups', [])
  albums, all_tracks = [], []
  
  print(f"\nProcessing {len(release_groups)} albums...")

  for idx, rg in enumerate(release_groups, 1):
    album_title = rg.get('title') or 'Unknown'
    try:
      album_id = rg.get('id')
      release_date = rg.get('first-release-date')
      album_obj = {
        'id': album_id,
        'title': album_title,
        'title_lowercase': album_title.lower(),
        'artistIds': [mbid],
        'releaseDate': release_date,
        'coverArtUrl': None,
        'tracklist': [],
        'platformLinks': {},
        'reviewCount': 0,
        'likesCount': 0,
      }

      time.sleep(1.1)
      rg_resp = safe_request(f'{MUSICBRAINZ_BASE}/release-group/{album_id}', headers=headers, params={'fmt': 'json', 'inc': 'releases'})
      rg_json = rg_resp.json()
      releases = rg_json.get('releases', [])
      release_id = releases[0].get('id') if releases else None

      if release_id:
        time.sleep(1.1)
        rel_resp = safe_request(f'{MUSICBRAINZ_BASE}/release/{release_id}', headers=headers, params={'fmt': 'json', 'inc': 'recordings+artists'})
        rel = rel_resp.json()

        cover_url = None
        try:
          ca_resp = requests.get(f'https://coverartarchive.org/release/{release_id}/front', headers=headers, timeout=5)
          if ca_resp.status_code == 200: cover_url = ca_resp.url
        except Exception: pass
        album_obj['coverArtUrl'] = cover_url or artist_obj.get('coverImageUrl')

        tracks = []
        for medium in rel.get('media', []):
          for tr in medium.get('tracks', []):
            rec = tr.get('recording', {}) or {}
            track_id = rec.get('id')
            track_title = tr.get('title') or rec.get('title') or ''
            length_ms = tr.get('length') or rec.get('length') or 0
            duration_sec = (length_ms // 1000) if length_ms else 0
            track_obj = {
              'id': track_id,
              'title': track_title,
              'title_lowercase': track_title.lower(),
              'duration': duration_sec,
              'artistIds': [mbid],
              'albumId': album_obj['id'],
              'releaseDate': album_obj['releaseDate'],
              'genre': None,
              'credits': {},
              'coverArtUrl': album_obj['coverArtUrl'],
              'platformLinks': {},
              'reviewCount': 0,
              'likesCount': 0,
            }
            tracks.append(track_obj)
            all_tracks.append(track_obj)
        album_obj['tracklist'] = [t['id'] for t in tracks]
      else:
        album_obj['tracklist'] = []

      album_obj['platformLinks'] = google_search(album_obj['title'], artist_obj['name'], 'album')
      albums.append(album_obj)
      print(f"  [{idx}/{len(release_groups)}] [OK] {album_title} ({len(album_obj['tracklist'])} tracks)")
    except Exception as e:
      print(f"  [{idx}/{len(release_groups)}] [ERROR] {album_title}: {str(e)[:80]}")
      continue

  print("\nFetching artist platform links...")
  artist_obj['platformLinks'] = google_search(artist_obj['name'], artist_obj['name'], 'artist')

  if all_tracks:
    print(f"\nProcessing platform links for {len(all_tracks)} tracks...")
    for idx, tr in enumerate(all_tracks, 1):
      try:
        tr['platformLinks'] = google_search(tr['title'], artist_obj['name'], 'track')
        if idx % 10 == 0 or idx == len(all_tracks):
          print(f"  Progress: {idx}/{len(all_tracks)} tracks")
      except Exception:
        tr['platformLinks'] = {}

  dump = {'artist': artist_obj, 'albums': albums, 'tracks': all_tracks}

  try: os.makedirs(OUTPUT_DIR, exist_ok=True)
  except Exception: pass

  timestamp = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
  safe_name = artist_obj['name'].replace(' ', '_') if artist_obj.get('name') else mbid
  fname = f"{safe_name}_{timestamp}.json"
  fpath = os.path.join(OUTPUT_DIR, fname)
  
  with open(fpath, 'w', encoding='utf-8') as f:
    json.dump(dump, f, ensure_ascii=False, indent=2)

  print(f"\n[OK] Successfully saved to: {fpath}")
  print(f"  - Artist: {artist_obj['name']}")
  print(f"  - Albums: {len(albums)}")
  print(f"  - Tracks: {len(all_tracks)}")
  
  return dump

if __name__ == "__main__":
  process_artist("coldplay")