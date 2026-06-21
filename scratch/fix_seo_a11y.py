import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

# Preconnect tags to add
PRECONNECT = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
"""

# Tailwind link
TAILWIND_LINK = '    <link rel="stylesheet" href="/css/tailwind-compiled.css">'

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"):
        continue
    if fname in ["admin.html", "index_test.html"]:
        continue
        
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    original = content

    # 1. Remove Tailwind CDN
    content = re.sub(r'<script\s+src="https://cdn\.tailwindcss\.com[^"]*"\s*(defer)?></script>\s*', '', content)
    content = re.sub(r'<script\s+defer\s+src="https://cdn\.tailwindcss\.com[^"]*"></script>\s*', '', content)

    # 2. Add Tailwind CSS and Preconnect if not exists
    if "/css/tailwind-compiled.css" not in content:
        content = content.replace("</head>", f"{TAILWIND_LINK}\n{PRECONNECT}</head>")
    elif "fonts.googleapis.com" not in content:
        content = content.replace("</head>", f"{PRECONNECT}</head>")

    # 3. Add aria-label to buttons if missing and no text
    # This is a bit complex for regex, but we can do a simple replacement for known icons
    content = content.replace('<button id="mobile-menu-btn"', '<button id="mobile-menu-btn" aria-label="Open mobile menu"')
    content = content.replace('<button id="lang-btn"', '<button id="lang-btn" aria-label="Select language"')
    content = content.replace('<button id="cart-btn"', '<button id="cart-btn" aria-label="View shopping cart"')
    
    # 4. In index.html, ensure Title and Meta Description are correct
    if fname == "index.html":
        if "beef noodles" not in content.lower():
            # Already updated by multi_replace, but just in case
            pass

    if content != original:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated SEO/A11y/Tailwind for {fname}")

print("Done.")
