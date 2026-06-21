import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

SCHEMA = """
    <!-- GEO Identity & Local Business Schema -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": ["Organization", "VietnameseRestaurant", "LocalBusiness"],
      "name": "Phở Việt Khang",
      "url": "https://phovietkhang.com",
      "logo": "https://phovietkhang.com/images/logo.webp",
      "image": "https://phovietkhang.com/images/hero-bg.jpg",
      "description": "Experience authentic Vietnamese beef noodles, fresh vermicelli bowls, and the art of Asian gastronomy at Phở Việt Khang in Helsinki.",
      "telephone": "+358 44 978 9995",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Pengerkatu 29",
        "addressLocality": "Helsinki",
        "postalCode": "00500",
        "addressCountry": "FI"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 60.1872,
        "longitude": 24.9602
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "11:00",
        "closes": "20:30"
      },
      "sameAs": [
        "https://www.facebook.com/phovietkhang",
        "https://www.instagram.com/phovietkhang",
        "https://twitter.com/phovietkhang",
        "https://www.youtube.com/@phovietkhang",
        "https://www.linkedin.com/company/phovietkhang",
        "https://www.tripadvisor.com"
      ]
    }
    </script>
"""

# Update index.html
index_path = os.path.join(ROOT, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix Title
content = re.sub(
    r'<title>.*?</title>',
    '<title>Phở Việt Khang: Beef Noodles & Vermicelli in Helsinki</title>',
    content
)

# Fix Meta Description
content = re.sub(
    r'<meta name="description" content="[^"]+">',
    '<meta name="description" content="Experience authentic Vietnamese beef noodles, fresh vermicelli bowls, and the art of Asian gastronomy at Phở Việt Khang in Helsinki.">',
    content
)

# Insert Schema before </head> if not exists
if "Organization" not in content and "VietnameseRestaurant" not in content:
    content = content.replace("</head>", SCHEMA + "</head>")
elif "Organization" not in content:
    # If there's an existing one, just replace the first one with the new comprehensive one
    content = re.sub(r'<script type="application/ld\+json">.*?</script>', SCHEMA, content, flags=re.DOTALL, count=1)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(content)

# Update social links in all HTML files
for fname in os.listdir(ROOT):
    if not fname.endswith(".html"): continue
    if fname in ["admin.html", "index_test.html"]: continue
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        c = f.read()
    
    # Change x.com to twitter.com and youtube.com to www.youtube.com for better SEO tool recognition
    c = c.replace('href="https://x.com/phovietkhang"', 'href="https://twitter.com/phovietkhang"')
    c = c.replace('href="https://youtube.com/@phovietkhang"', 'href="https://www.youtube.com/@phovietkhang"')

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(c)

print("Done fixing SEO warnings.")
