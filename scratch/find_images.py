from bs4 import BeautifulSoup
import re

with open("index.html", "r", encoding="utf-8") as f:
    soup = BeautifulSoup(f.read(), "html.parser")

for img in soup.find_all("img"):
    print(f"SRC: {img.get('src')}")
    print(f"CLASS: {img.get('class')}")
    print("---")
