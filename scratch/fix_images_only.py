import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"): continue
    if fname in ["admin.html", "index_test.html"]: continue
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace logo.png with logo.webp
    content = content.replace("logo.png", "logo.webp")

    # Add lazy loading to images except hero-bg.jpg
    def add_lazy(match):
        img_tag = match.group(0)
        if "hero-bg" in img_tag or 'loading="lazy"' in img_tag:
            return img_tag
        return img_tag.replace("<img ", '<img loading="lazy" decoding="async" ')

    content = re.sub(r'<img [^>]*>', add_lazy, content)

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)

print("Done fixing images.")
