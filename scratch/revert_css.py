import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>'

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"):
        continue
    if fname in ["admin.html", "index_test.html"]:
        continue
        
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # Remove the compiled css link
    content = content.replace('    <link rel="stylesheet" href="/css/tailwind-compiled.css">\n', '')
    content = content.replace('<link rel="stylesheet" href="/css/tailwind-compiled.css">', '')

    # Re-add Tailwind CDN right before </head> if not exists
    if "cdn.tailwindcss.com" not in content:
        content = content.replace("</head>", f"    {TAILWIND_CDN}\n</head>")

    if content != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Reverted CSS for {fname}")

print("Done reverting CSS.")
