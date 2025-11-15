import pandas as pd
import json

data = pd.read_csv("spotify.csv")
print(data[:10])

with open("./auto/artist.json", "w", encoding="utf-8") as f:
  json.dump(list(data["artist"]), f)

print("done!")