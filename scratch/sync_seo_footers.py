import os
import re

directories = [
    r"c:\Users\minhb\OneDrive\Desktop\phovietkhang",
    r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"
]

html_filenames = [
    "about.html", "careers.html", "cart.html", "checkout.html", "confirm-order.html",
    "contact.html", "inbox.html", "index.html", "locations.html", "login.html",
    "menu.html", "order-history.html", "order-tracking.html", "press.html",
    "privacy.html", "profile.html", "register.html", "reservations.html",
    "rewards-store.html", "terms.html", "404.html"
]

ga_script = """<!-- Google Analytics (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H1DLYMFL1E"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-H1DLYMFL1E');
    </script>"""

# Added alt="Facebook Pixel" to noscript image to pass SEO alt-text compliance check
fb_pixel_script = """<!-- Facebook Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'FACEBOOK_PIXEL_ID_PLACEHOLDER');
      fbq('track', 'PageView');
    </script>
    <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=FACEBOOK_PIXEL_ID_PLACEHOLDER&ev=PageView&noscript=1" alt="Facebook Pixel" /></noscript>
    <!-- End Facebook Pixel Code -->"""

# Extract the reference footer from Desktop index.html
desktop_index_path = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang\index.html"
with open(desktop_index_path, "r", encoding="utf-8") as f:
    desktop_index_content = f.read()

footer_match = re.search(r"<footer\b[^>]*>.*?</footer>", desktop_index_content, re.DOTALL)
if not footer_match:
    raise ValueError("Could not find footer component in Desktop index.html")

reference_footer = footer_match.group(0)
print("Extracted reference footer successfully.")

def update_html_file(filepath, filename):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Determine canonical and hreflang URLs
    if filename == "index.html":
        base_url = "https://phovietkhang.com/"
    else:
        clean_name = filename[:-5] if filename.endswith(".html") else filename
        base_url = f"https://phovietkhang.com/{clean_name}"

    canonical_tag = f'<link rel="canonical" href="{base_url}" />'
    hreflang_tags = f"""<link rel="alternate" hreflang="vi" href="{base_url + '?lang=vi' if filename == 'index.html' else base_url + '?lang=vi'}" />
    <link rel="alternate" hreflang="en" href="{base_url + '?lang=en' if filename == 'index.html' else base_url + '?lang=en'}" />
    <link rel="alternate" hreflang="fi" href="{base_url + '?lang=fi' if filename == 'index.html' else base_url + '?lang=fi'}" />
    <link rel="alternate" hreflang="sv" href="{base_url + '?lang=sv' if filename == 'index.html' else base_url + '?lang=sv'}" />
    <link rel="alternate" hreflang="x-default" href="{base_url}" />"""

    # 1. Update Footer (if <footer> tag exists and it's not 404)
    if filename != "404.html" and re.search(r"<footer\b[^>]*>.*?</footer>", content, re.DOTALL):
        content = re.sub(r"<footer\b[^>]*>.*?</footer>", reference_footer, content, flags=re.DOTALL)
    
    # 2. Clean existing canonical tags
    content = re.sub(r"<link\s+rel=[\"']canonical[\"']\s+href=[\"'][^\"']*[\"']\s*/?>", "", content, flags=re.IGNORECASE)
    
    # 3. Clean existing alternate hreflangs
    content = re.sub(r"<link\s+rel=[\"']alternate[\"']\s+hreflang=[\"'][^\"']*[\"']\s+href=[\"'][^\"']*[\"']\s*/?>", "", content, flags=re.IGNORECASE)
    
    # 4. Clean existing GA and FB pixel blocks if present to avoid duplicates
    # Remove existing gtag.js scripts
    content = re.sub(r"<!-- Google Analytics \(gtag\.js\) -->.*?config', 'G-H1DLYMFL1E'\);\s*</script>", "", content, flags=re.DOTALL)
    content = re.sub(r"<script[^>]*src=[\"']https://www\.googletagmanager\.com/gtag/js.*?config', 'G-H1DLYMFL1E'\);\s*</script>", "", content, flags=re.DOTALL)
    # Remove existing Facebook Pixel block
    content = re.sub(r"<!-- Facebook Pixel Code -->.*?<!-- End Facebook Pixel Code -->", "", content, flags=re.DOTALL)
    
    # 5. Clean internal links (replace relative .html links with clean URLs)
    content = re.sub(r'href="index\.html"', 'href="/"', content)
    content = re.sub(r'href="\./index\.html"', 'href="/"', content)
    content = re.sub(r'href="index\.html(?=[?#])', 'href="/', content)
    content = re.sub(r'href="\./index\.html(?=[?#])', 'href="/', content)
    
    def clean_link_repl(match):
        path = match.group(1)
        suffix = match.group(2) or ""
        if path.startswith(('http://', 'https://', 'javascript:', 'mailto:', 'tel:')):
            return match.group(0)
        if '/' in path:
            return match.group(0)
        return f'href="/{path}{suffix}"'

    content = re.sub(r'href="([^"/#?]+)\.html([?#][^"]*)?"', clean_link_repl, content)
    content = re.sub(r'href="\./([^"/#?]+)\.html([?#][^"]*)?"', clean_link_repl, content)

    # 6. For 404.html, make sure it has a description tag
    if filename == "404.html":
        # Remove existing description if any, to avoid duplicate
        content = re.sub(r"<meta\s+name=[\"']description[\"']\s+content=[\"'][^\"']*[\"']\s*/?>", "", content, flags=re.IGNORECASE)
        # We will add it inside the head injection
        desc_meta = '\n    <meta name="description" content="Page Not Found - Phở Việt Khang | Authentic Vietnamese Restaurant in Helsinki" />'
    else:
        desc_meta = ""

    # 7. Inject scripts and tags into <head>
    head_match = re.search(r"<head>(.*?) </head>|<head>(.*?)</head>", content, re.DOTALL | re.IGNORECASE)
    if not head_match:
        print(f"Warning: Could not find <head> tag in {filename}")
        return

    # Let's insert GA and FB Pixel right after <head> tag
    # And canonical/hreflang tags right before </head> tag
    
    # Insert GA & FB Pixel at the beginning of head, and description meta if 404
    content = re.sub(r"<head>", f"<head>\n    {ga_script}\n    {fb_pixel_script}{desc_meta}", content, count=1, flags=re.IGNORECASE)
    
    # Insert canonical & hreflang before </head>
    content = re.sub(r"</head>", f"    {canonical_tag}\n    {hreflang_tags}\n</head>", content, count=1, flags=re.IGNORECASE)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Updated {filename}")

for d in directories:
    if not os.path.exists(d):
        print(f"Directory {d} does not exist. Skipping.")
        continue
    print(f"\nProcessing directory: {d}")
    for filename in html_filenames:
        filepath = os.path.join(d, filename)
        if os.path.exists(filepath):
            update_html_file(filepath, filename)
        else:
            print(f"File {filename} not found in {d}")
