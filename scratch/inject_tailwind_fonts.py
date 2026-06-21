"""
Inject missing Google Fonts, Tailwind CSS CDN, and Tailwind Config into HTML pages.
Only index.html has these; all other client-facing pages are missing them.
"""
import os, re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

# Pages that already have Tailwind + Fonts, or are special
SKIP = {"index.html", "index_test.html", "admin.html", "404.html",
        "careers.html", "press.html", "privacy.html", "terms.html"}

# The block to inject — goes right after the last </style> or after favicon links
INJECT_BLOCK = r"""<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Config -->
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "inverse-primary": "#a9c7ff",
                      "surface-dim": "#d8dadc",
                      "outline-variant": "#c4c6d0",
                      "on-surface": "#191c1e",
                      "outline": "#747780",
                      "secondary-fixed-dim": "#c8c6c5",
                      "on-error-container": "#93000a",
                      "surface-container-highest": "#e0e3e5",
                      "tertiary-fixed-dim": "#b7c8e1",
                      "background": "#f7f9fb",
                      "surface-tint": "#405f91",
                      "on-secondary-fixed": "#1c1b1b",
                      "on-primary-fixed": "#001b3d",
                      "on-tertiary-fixed": "#0b1c30",
                      "secondary-container": "#e2dfde",
                      "on-secondary-container": "#636262",
                      "surface-bright": "#f7f9fb",
                      "on-primary-fixed-variant": "#264778",
                      "error-container": "#ffdad6",
                      "primary-container": "#002b5b",
                      "on-secondary-fixed-variant": "#474746",
                      "surface": "#f7f9fb",
                      "on-error": "#ffffff",
                      "tertiary-container": "#1d2d41",
                      "inverse-on-surface": "#eff1f3",
                      "secondary": "#5f5e5e",
                      "tertiary-fixed": "#d3e4fe",
                      "on-tertiary-container": "#8495ad",
                      "primary-fixed-dim": "#a9c7ff",
                      "surface-variant": "#e0e3e5",
                      "on-primary-container": "#7594ca",
                      "on-primary": "#ffffff",
                      "surface-container-high": "#e6e8ea",
                      "surface-container-low": "#f2f4f6",
                      "on-surface-variant": "#43474f",
                      "error": "#ba1a1a",
                      "primary": "#001736",
                      "on-tertiary-fixed-variant": "#38485d",
                      "primary-fixed": "#d6e3ff",
                      "on-tertiary": "#ffffff",
                      "inverse-surface": "#2d3133",
                      "surface-container": "#eceef0",
                      "secondary-fixed": "#e5e2e1",
                      "surface-container-lowest": "#ffffff",
                      "tertiary": "#07182b",
                      "on-background": "#191c1e",
                      "on-secondary": "#ffffff"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "gutter": "28px",
                      "max-width": "1284px",
                      "margin-mobile": "20px",
                      "margin-desktop": "68px",
                      "unit": "12px"
              },
              "fontFamily": {
                      "body-sm": ["Inter"],
                       "display-lg-mobile": ["EB Garamond"],
                       "title-lg": ["Inter"],
                       "label-caps": ["Inter"],
                       "display-lg": ["EB Garamond"],
                       "headline-sm": ["EB Garamond"],
                       "body-lg": ["Inter"],
                       "headline-md": ["EB Garamond"],
                       "body-md": ["Inter"]
               },
               "fontSize": {
                       "body-sm": ["18px", {"lineHeight": "24px", "fontWeight": "400"}],
                       "display-lg-mobile": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                       "title-lg": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                       "label-caps": ["16px", {"lineHeight": "20px", "letterSpacing": "0.08em", "fontWeight": "700"}],
                       "display-lg": ["52px", {"lineHeight": "60px", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                       "headline-sm": ["28px", {"lineHeight": "36px", "fontWeight": "500"}],
                       "body-lg": ["22px", {"lineHeight": "32px", "fontWeight": "400"}],
                       "headline-md": ["36px", {"lineHeight": "44px", "fontWeight": "500"}],
                       "body-md": ["20px", {"lineHeight": "28px", "fontWeight": "400"}]
               }
       },
           },
         }
     </script>
<style>
        body {
            font-family: 'Inter', sans-serif;
        }
        h1, h2, h3, h4, h5, h6 { font-family: 'EB Garamond', serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
    </style>"""

count = 0
for fname in os.listdir(ROOT):
    if not fname.endswith(".html") or fname in SKIP:
        continue
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already has tailwind
    if "cdn.tailwindcss.com" in content:
        print(f"  SKIP (already has Tailwind): {fname}")
        continue

    # Strategy: insert right after the <title>...</title> line
    # Find the title tag and insert after it
    title_match = re.search(r'(<title>.*?</title>)', content, re.DOTALL)
    if title_match:
        insert_pos = title_match.end()
        new_content = content[:insert_pos] + "\n" + INJECT_BLOCK + "\n" + content[insert_pos:]
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(new_content)
        count += 1
        print(f"  INJECTED: {fname}")
    else:
        print(f"  WARNING: No <title> found in {fname}")

print(f"\nDone! Injected into {count} files.")
