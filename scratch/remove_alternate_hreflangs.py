import os
import re

directory = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
github_directory = r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'

html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

def clean_hreflangs(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove alternate links with hreflangs
    cleaned = re.sub(r'<link\s+rel=["\']alternate["\']\s+hreflang=["\'][^>]*>\n?', '', content, flags=re.IGNORECASE)

    if cleaned != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(cleaned)
        print(f"Cleaned hreflangs in {os.path.basename(filepath)}")

for f in html_files:
    clean_hreflangs(os.path.join(directory, f))
    clean_hreflangs(os.path.join(github_directory, f))

print("Hreflang tags cleaned up!")
