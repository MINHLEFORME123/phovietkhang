import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"
FOOTER_FILE = os.path.join(ROOT, "scratch", "old_footer.html")

with open(FOOTER_FILE, "r", encoding="utf-8") as f:
    new_footer = f.read()

count = 0
for fname in os.listdir(ROOT):
    if not fname.endswith(".html"):
        continue
    if fname in ["admin.html", "index_test.html", "404.html"]:
        continue

    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the footer
    # using regex to replace <footer ...>...</footer>
    new_content = re.sub(r'<footer.*?</footer>', new_footer, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        count += 1
        print(f"Restored footer in {fname}")

print(f"Done! Restored footer in {count} files.")
