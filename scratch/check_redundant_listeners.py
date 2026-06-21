import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

for fname in os.listdir(ROOT):
    if fname.endswith(".html"):
        fpath = os.path.join(ROOT, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        has_listener = "document.querySelector('[aria-label=\"Toggle Menu\"]')" in content and "addEventListener" in content
        print(f"{fname}: has_listener={has_listener}")
