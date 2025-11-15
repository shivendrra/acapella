import os, requests
from dotenv import load_dotenv

load_dotenv()

GOOGLE_SEARCH_API = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_SEARCH_CX = os.getenv("GOOGLE_SEARCH_CX")
WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"

headers = {
  'User-Agent': 'Acapella/1.0 (shivharsh44@gmail.com)',
  'Accept': 'application/json'
}

def refine_query(artist_name):
  sites = [
    "site:open.spotify.com",
    "site:music.apple.com",
    "site:youtube.com",
    "site:instagram.com",
    "site:twitter.com"
  ]
  search_filter = " OR ".join(sites)
  query = f"{search_filter} '{artist_name}'"
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
  items = resp.json().get('items', [])
  links = {}
  for item in items:
    link = item.get('link')
    if 'open.spotify.com' in link:
      links.setdefault('spotify', link)
    elif 'music.apple.com' in link:
      links.setdefault('appleMusic', link)
    elif 'music.youtube.com' in link:
      links.setdefault('youtubeMusic', link)
    if len(links) >= 3:
      break
  return links

def search_images(query, limit):
  params = {
    "action": "query",
    "format": "json",
    "generator": "search",
    "gsrsearch": query,
    "gsrlimit": limit,
    "gsrtype": "file",
    "prop": "imageinfo",
    "iiprop": "url|size",
  }

  resp = requests.get(WIKIMEDIA_API, headers=headers, params=params)
  resp.raise_for_status()
  data = resp.json()

  results = []
  pages = data.get("query", {}).get("pages", {})
  for pageid, page in pages.items():
    title = page.get("title")
    imageinfo = page.get("imageinfo", [])
    if title and imageinfo:
      info = imageinfo[0]
      results.append({
        "title": title,
        "url": info.get("url"),
        "width": info.get("width"),
        "height": info.get("height"),
      })
  return results

def get_best_image(query: str, min_width: int = 1080):
  images = search_images(query, limit=20)
  big_images = [img for img in images if img["width"] and img["width"] >= min_width]
  if big_images:
    best = max(big_images, key=lambda img: img["width"])
    return best["url"]
  else:
    if images:
      best = max(images, key=lambda img: (img["width"] or 0) * (img["height"] or 0))
      return best["url"]
  return None