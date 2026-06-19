import os
import re

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

mobile_sv_button = """
                <button class="w-8 h-8 flex items-center justify-center rounded-full overflow-hidden hover:opacity-80 transition-all ring-2 ring-transparent hover:ring-white/30" aria-label="Svenska" onclick="changeLanguage('sv')">
                    <img id="lang-sv-mobile" src="https://hatscripts.github.io/circle-flags/flags/se.svg" alt="SV" class="w-full h-full object-cover">
                </button>"""

for d in directories:
    if not os.path.exists(d):
        continue
        
    for root, _, files in os.walk(d):
        if 'node_modules' in root or '.git' in root or 'scratch' in root or '.gemini' in root:
            continue
            
        html_files = [f for f in files if f.endswith('.html')]
        for filename in html_files:
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            orig_content = content
            
            # 1. Fix the escaped quotes
            content = content.replace(r"changeLanguage(\'vi\')", "changeLanguage('vi')")
            content = content.replace(r"changeLanguage(\'en\')", "changeLanguage('en')")
            content = content.replace(r"changeLanguage(\'fi\')", "changeLanguage('fi')")
            content = content.replace(r"changeLanguage(\'sv\')", "changeLanguage('sv')")
            
            # 2. Fix duplicate aria-labels (some might be double like aria-label="Tiếng Việt" aria-label="Tiếng Việt")
            content = re.sub(r'(aria-label="[^"]+")\s+\1', r'\1', content)
            
            # 3. Add Swedish to mobile menu if missing
            # Find the mobile language container. Usually it ends with the fi button before the closing div and next flex col.
            if 'lang-fi-mobile' in content and 'lang-sv-mobile' not in content:
                # We locate the fi mobile button block and append the sv block right after it
                fi_mobile_pattern = r'(<button[^>]+onclick="changeLanguage\(\'fi\'\)">\s*<img id="lang-fi-mobile"[^>]+>\s*</button>)'
                content = re.sub(fi_mobile_pattern, r'\1' + mobile_sv_button, content)

            if orig_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed syntax errors and updated mobile menu in {filepath}")

print("Done fixing syntax errors in all HTML files.")
