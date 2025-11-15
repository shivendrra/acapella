import json

with open(f"./artist.json", "r") as infile:
  queries = json.load(infile)

class Artists:
  def __init__(self) -> None: pass
  def __call__(self) -> list: return queries["artists"]