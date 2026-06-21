import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

# Read extracted TW config
with open(os.path.join(ROOT, "scratch", "tw_config.txt"), "r", encoding="utf-8") as f:
    tw_config = f.read()

CDN_TAG = '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>'

for fname in os.listdir(ROOT):
    if not fname.endswith(".html"): continue
    if fname in ["admin.html", "index_test.html"]: continue
    fpath = os.path.join(ROOT, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # If already has tailwind config, skip
    if '<script id="tailwind-config">' in content:
        continue

    # Insert after CDN tag
    if CDN_TAG in content:
        content = content.replace(CDN_TAG, CDN_TAG + "\n    " + tw_config)
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Injected TW config into {fname}")

# Inject Cookie Banner into client.js
client_js_path = os.path.join(ROOT, "js", "client.js")
with open(client_js_path, "r", encoding="utf-8") as f:
    client_js = f.read()

cookie_banner_code = """
// --- GDPR Cookie Consent Banner ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookie_consent_accepted')) {
        const banner = document.createElement('div');
        banner.id = 'gdpr-cookie-banner';
        banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:rgba(20,20,20,0.95);color:#fff;padding:15px;text-align:center;z-index:99999;font-family:sans-serif;display:flex;justify-content:center;align-items:center;gap:20px;flex-wrap:wrap;border-top:1px solid #333;backdrop-filter:blur(10px);';
        banner.innerHTML = `
            <p style="margin:0;font-size:14px;color:#ddd;max-width:800px;">We use cookies to ensure you get the best experience on our website, personalize content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
            <button id="accept-cookies-btn" style="background:#fff;color:#1a1a1a;border:none;padding:8px 24px;border-radius:20px;cursor:pointer;font-weight:bold;font-size:14px;transition:background 0.3s;">Accept All</button>
        `;
        document.body.appendChild(banner);
        
        document.getElementById('accept-cookies-btn').addEventListener('click', () => {
            localStorage.setItem('cookie_consent_accepted', 'true');
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        });
    }
});
"""

if "GDPR Cookie Consent Banner" not in client_js:
    with open(client_js_path, "a", encoding="utf-8") as f:
        f.write("\n" + cookie_banner_code)
    print("Injected Cookie Banner into client.js")

print("Done injecting.")
