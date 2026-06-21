import os
import re

JS_DIR = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang\js"

def safe_replace(content):
    # Replace `.addEventListener` with `?.addEventListener` for direct queries
    # document.getElementById('...').addEventListener
    # document.querySelector('...').addEventListener
    content = re.sub(r'(document\.getElementById\([^)]+\))\s*\.\s*addEventListener', r'\1?.addEventListener', content)
    content = re.sub(r'(document\.querySelector\([^)]+\))\s*\.\s*addEventListener', r'\1?.addEventListener', content)
    
    # Also fix classList if chained directly
    content = re.sub(r'(document\.getElementById\([^)]+\))\s*\.\s*classList', r'\1?.classList', content)
    content = re.sub(r'(document\.querySelector\([^)]+\))\s*\.\s*classList', r'\1?.classList', content)

    # In client.js, `const hamburgerBtn = document.getElementById('hamburger-btn');`
    # `if (hamburgerBtn)` etc is usually safer.
    return content

for fname in os.listdir(JS_DIR):
    if not fname.endswith(".js"):
        continue
    fpath = os.path.join(JS_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    
    new_content = safe_replace(content)
    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Fixed optional chaining in {fname}")
