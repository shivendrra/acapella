import os, requests, time

MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2"
AUDIODB_BASE = "https://www.theaudiodb.com/api/v1/json/123"

headers = {
  'User-Agent': 'Acapella/1.0 (shivharsh44@gmail.com)',
  'Accept': 'application/json'
}

def search_musicbrainz(name):
  params = {'query': f'artist:{name}', 'fmt':'json', 'limit': 1}
  time.sleep(1.1)
  resp = requests.get(f'{MUSICBRAINZ_BASE}/artist/', headers=headers, params=params)
  resp.raise_for_status()
  data = resp.json()
  if data.get('artists'):
    return data['artists'][0]
  return None

def lookup_musicbrainz(mbid):
  params = {'fmt': 'json', 'inc': 'url-rels+release-groups+recordings'}
  time.sleep(1.1)
  resp = requests.get(f'{MUSICBRAINZ_BASE}/artist/{mbid}', headers=headers, params=params)
  resp.raise_for_status()
  return resp.json()

def fetch_artist_img(mb_artist_id):
  try:
    time.sleep(0.5)
    resp = requests.get(f"{AUDIODB_BASE}/artist-mb.php?i={mb_artist_id}")
    resp.raise_for_status()
    data = resp.json().get('artists')
    if data:
      return data[0]
  except Exception as e:
    print(f"AudioDB fetch failed: {e}")
  return None