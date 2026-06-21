import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

with open(os.path.join(ROOT, "scratch", "tw_config.txt"), "r", encoding="utf-8") as f:
    tw_config = f.read()

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"): continue
    if fname in ["admin.html", "index_test.html"]: continue
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    if '<script id="tailwind-config">' in content:
        continue

    # Use regex to find any script tag containing tailwindcss.com
    new_content = re.sub(
        r'(<script[^>]*src="https://cdn\.tailwindcss\.com[^"]*"[^>]*></script>)',
        r'\1\n' + tw_config,
        content
    )
    
    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Injected TW config into {fname}")

print("Done injecting regex.")
