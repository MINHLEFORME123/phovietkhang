import os
import re

directory = r'c:\Users\minhb\OneDrive\Desktop\phovietkhang'
github_directory = r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'

html_files = [
    "about.html", "careers.html", "cart.html", "checkout.html", "confirm-order.html",
    "contact.html", "inbox.html", "index.html", "locations.html", "login.html",
    "menu.html", "order-history.html", "order-tracking.html", "press.html",
    "privacy.html", "profile.html", "register.html", "reservations.html",
    "rewards-store.html", "terms.html", "404.html"
]

rich_schema = """
<script type="application/ld+json">
[
  {
    "@context": "https://schema.org",
    "@type": "VietnameseRestaurant",
    "name": "Phở Việt Khang - Sörnäinen (Pengerkatu)",
    "alternateName": [
      "Pho Viet Khang Sornainen",
      "Pho Viet Khang Sörnäinen",
      "Pho Viet Khang Kallio",
      "Phở ngon Sörnäinen",
      "Phở ngon Sornainen",
      "Phở ngon Helsinki",
      "Paras Pho Helsinki",
      "Paras Pho Sörnäinen"
    ],
    "image": "https://phovietkhang.com/images/hero-bg.jpg",
    "telephone": "+358 44 978 9995",
    "url": "https://phovietkhang.com/",
    "menu": "https://phovietkhang.com/menu",
    "priceRange": "$$",
    "servesCuisine": ["Vietnamese", "Pho", "Noodle Soup"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Pengerkatu 29",
      "addressLocality": "Helsinki",
      "addressRegion": "Sörnäinen / Kallio",
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
      "https://www.tripadvisor.com"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "VietnameseRestaurant",
    "name": "Phở Việt Khang - Easton Helsinki",
    "alternateName": [
      "Pho Viet Khang Easton",
      "Pho Viet Khang Itäkeskus",
      "Phở ngon Itäkeskus",
      "Phở ngon Helsinki",
      "Paras Pho Itäkeskus"
    ],
    "image": "https://phovietkhang.com/images/hero-bg.jpg",
    "telephone": "+358 44 978 9995",
    "url": "https://phovietkhang.com/locations",
    "menu": "https://phovietkhang.com/menu",
    "priceRange": "$$",
    "servesCuisine": ["Vietnamese", "Pho", "Noodle Soup"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Kauppakartanonkatu 3",
      "addressLocality": "Helsinki",
      "addressRegion": "Itäkeskus / Easton",
      "postalCode": "00930",
      "addressCountry": "FI"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 60.2098,
      "longitude": 25.0855
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "11:00",
      "closes": "21:00"
    },
    "sameAs": [
      "https://www.facebook.com/phovietkhang",
      "https://www.instagram.com/phovietkhang",
      "https://www.tripadvisor.com"
    ]
  }
]
</script>
"""

meta_keywords = """
    <meta name="keywords" content="phở ngon helsinki, phở ngon sornainen, best pho helsinki, best pho sornainen, phở việt khang sörnäinen, phở sornainen, phở helsinki, vietnamese restaurant helsinki, sörnäinen pho, sornainen pho, paras pho helsinki, paras pho sörnäinen, Kallio pho, Kallio, Easton pho, Itäkeskus pho" />
"""

def update_seo(filepath, filename):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract title
    title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
    title = title_match.group(1) if title_match else "Phở Việt Khang"

    # Extract description
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', content, re.IGNORECASE)
    if not desc_match:
        desc_match = re.search(r'<meta\s+content=["\'](.*?)["\']\s+name=["\']description["\']', content, re.IGNORECASE)
    desc = desc_match.group(1) if desc_match else "Experience the best authentic Vietnamese pho at Phở Việt Khang in Sörnäinen and Easton Helsinki."

    # Force Sörnäinen / phở ngon keyword optimization in homepage title and description
    if filename == "index.html":
        title = "PHỞ VIỆT KHANG | Phở ngon Sörnäinen & Helsinki chuẩn vị"
        desc = "Thèm phở ngon ở Sörnäinen (Sornainen) hay Helsinki? Ghé ngay nhà hàng Phở Việt Khang tại Pengerkatu 29 (Sörnäinen) hoặc Easton để thưởng thức phở hầm xương 24h đậm đà!"
        
        # Replace title block
        content = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', content, flags=re.IGNORECASE)
        # Replace description block
        content = re.sub(r'<meta\s+name=["\']description["\']\s+content=["\'][^"\']*["\']\s*/?>', f'<meta name="description" content="{desc}" />', content, flags=re.IGNORECASE)

    # Extract canonical URL
    if filename == "index.html":
        canonical_url = "https://phovietkhang.com/"
    else:
        clean_name = filename[:-5] if filename.endswith(".html") else filename
        canonical_url = f"https://phovietkhang.com/{clean_name}"

    # Remove any existing OpenGraph and Twitter tags to prevent duplicates
    content = re.sub(r'<meta\s+property=["\']og:[^>]*>\n?', '', content)
    content = re.sub(r'<meta\s+property=["\']twitter:[^>]*>\n?', '', content)
    content = re.sub(r'<meta\s+name=["\']twitter:[^>]*>\n?', '', content)
    content = re.sub(r'<meta\s+name=["\']keywords["\']\s+content=["\'][^>]*>\n?', '', content)
    content = re.sub(r'<script\s+type=["\']application/ld\+json["\']\s*>.*?</script>\n?', '', content, flags=re.DOTALL)

    # Build OpenGraph and Twitter Card tags
    seo_tags = f"""
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{canonical_url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:image" content="https://phovietkhang.com/images/logo.png">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="{canonical_url}">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="https://phovietkhang.com/images/logo.png">
"""

    # Insert right before </head>
    if '</head>' in content:
        # We append keywords, og tags, and the rich restaurant schema
        content = content.replace('</head>', meta_keywords + seo_tags + rich_schema + '</head>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Injected SEO & Rich Restaurant Schema into {filename}")

# Apply to Desktop and GitHub
for filename in html_files:
    update_seo(os.path.join(directory, filename), filename)
    update_seo(os.path.join(github_directory, filename), filename)

print("Successfully injected OG tags, Twitter tags, meta keywords, and rich VietnameseRestaurant JSON-LD schemas!")
