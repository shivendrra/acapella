import json
from process import process_artist

with open(f"./files/artist.json", "r") as infile:
  queries = json.load(infile)

class Artists:
  def __init__(self) -> None: pass
  def __call__(self) -> list: return queries

art = Artists()
data = art()[:100]

for artist in data:
  print("\nfetching details for: ", artist)
  process_artist(artist)