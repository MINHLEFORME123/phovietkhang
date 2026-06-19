import os
import re

directory = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang'
html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

# Structured data to inject in index.html
structured_data = """
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Phở Việt Khang",
  "image": "https://phovietkhang.com/images/hero-bg.jpg",
  "description": "Experience authentic Vietnamese cuisine at Phở Việt Khang in Helsinki. Delicious pho, fresh spring rolls, and traditional dishes.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Pengerkatu 29",
    "addressLocality": "Helsinki",
    "postalCode": "00500",
    "addressCountry": "FI"
  },
  "telephone": "+358 44 978 9995",
  "url": "https://phovietkhang.com",
  "menu": "https://phovietkhang.com/menu.html",
  "servesCuisine": "Vietnamese",
  "priceRange": "$$"
}
</script>
"""

def process_file(filename):
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the end of <head>
    head_end_idx = content.find('</head>')
    if head_end_idx == -1:
        return

    # Extract current head content
    head_content = content[:head_end_idx]
    
    # 1. Favicon
    if 'rel="icon"' not in head_content and 'rel="shortcut icon"' not in head_content:
        favicon_tag = '\n<link rel="icon" type="image/svg+xml" href="images/favicon.svg">\n'
        head_content += favicon_tag

    # 2. Canonical URL
    if 'rel="canonical"' not in head_content:
        canonical_url = f"https://phovietkhang.com/{'' if filename == 'index.html' else filename}"
        canonical_tag = f'<link rel="canonical" href="{canonical_url}" />\n'
        head_content += canonical_tag

    # 3. Meta Description
    if '<meta name="description"' not in head_content.lower() and '<meta content="description"' not in head_content.lower():
        desc = "Experience authentic Vietnamese cuisine at Phở Việt Khang in Helsinki. Delicious pho, fresh spring rolls, and traditional dishes. Book your table now!"
        meta_desc = f'<meta name="description" content="{desc}" />\n'
        head_content += meta_desc

    # 4. Hreflang (for all files)
    if 'hreflang="en"' not in head_content:
        hreflang_tags = f"""<link rel="alternate" hreflang="vi" href="https://phovietkhang.com/{'' if filename == 'index.html' else filename}" />
<link rel="alternate" hreflang="en" href="https://phovietkhang.com/{'' if filename == 'index.html' else filename}" />
<link rel="alternate" hreflang="fi" href="https://phovietkhang.com/{'' if filename == 'index.html' else filename}" />
<link rel="alternate" hreflang="sv" href="https://phovietkhang.com/{'' if filename == 'index.html' else filename}" />
<link rel="alternate" hreflang="x-default" href="https://phovietkhang.com/{'' if filename == 'index.html' else filename}" />\n"""
        head_content += hreflang_tags

    # 5. Title fixing (index.html only)
    if filename == 'index.html':
        title_pattern = r'<title>.*?</title>'
        new_title = '<title>Phở Việt Khang | Authentic Vietnamese Restaurant Helsinki</title>'
        if re.search(title_pattern, head_content):
            head_content = re.sub(title_pattern, new_title, head_content)
        else:
            head_content += new_title + '\n'

        # 6. Structured Data
        if 'application/ld+json' not in head_content:
            head_content += structured_data

    new_full_content = head_content + content[head_end_idx:]
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_full_content)
    
    print(f"Processed {filename}")

for f in html_files:
    process_file(f)

print("All HTML files updated with SEO meta tags.")
