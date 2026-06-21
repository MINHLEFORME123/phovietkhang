import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"):
        continue
    if fname in ["admin.html", "index_test.html", "404.html"]:
        continue
        
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # 1. logo.png to logo.webp
    content = content.replace("images/logo.png", "images/logo.webp")
    content = content.replace("/images/logo.png", "/images/logo.webp")
    content = content.replace("logo.png", "logo.webp")

    # 2. Defer local scripts
    # Find <script src="..."> where it does not have defer, and does not contain tailwind
    def defer_script(match):
        script_tag = match.group(0)
        if "defer" in script_tag or "tailwindcss.com" in script_tag or "paytrail" in script_tag:
            return script_tag
        return script_tag.replace("<script ", "<script defer ")

    content = re.sub(r'<script\s+[^>]*src="[^"]+"[^>]*>', defer_script, content)

    # 3. Add lazy load to images
    # We want to add loading="lazy" decoding="async" to <img> tags
    def lazy_img(match):
        img_tag = match.group(0)
        # Check if it's the hero image (we don't want lazy load on hero)
        if "hero-img" in img_tag or "hero image" in img_tag.lower():
            # optionally add fetchpriority="high" instead
            if "fetchpriority" not in img_tag:
                return img_tag.replace("<img ", '<img fetchpriority="high" ')
            return img_tag
        
        # for other images, add lazy loading if not present
        if "loading=" not in img_tag:
            img_tag = img_tag.replace("<img ", '<img loading="lazy" decoding="async" ')
        return img_tag

    content = re.sub(r'<img\s+[^>]*>', lazy_img, content)

    if content != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Optimized {fname}")

print("Done optimizing HTML files.")
