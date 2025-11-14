import os, time, json, requests

GOOGLE_SEARCH_API = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_SEARCH_CX = os.getenv("GOOGLE_SEARCH_CX")

def refine_query(artist_name):
  sites = [
      "site:open.spotify.com",
      "site:music.apple.com",
      "site:youtube.com",
      "site:instagram.com",
      "site:twitter.com" ]
  search_filter = " OR ".join(sites)
  query = f"{search_filter} \ '{artist_name}'"
  return query

def google_search(entity_name, artist_name, entity_type):
  query = refine_query(artist_name)
  params = {
    'key': GOOGLE_SEARCH_API,
    'cx': GOOGLE_SEARCH_CX,
    'q': query,
    'num': 10
  }
  resp = requests.get('https://www.googleapis.com/customsearch/v1', params=params)
  resp.raise_for_status()
  items = resp.join().get('items', [])
  links = {}
  for item in items:
    link = item.get('link')
    if 'open.spotify.com' in link:
      links.setdefault('spotify', link)
    elif 'music.apple.com' in link:
      links.setdefault('appleMusic', link)
    elif 'music.youtube.com' in link:
      links.setdefault('youtubeMusic', link)
    if (len) >= 3:
      break
  return links