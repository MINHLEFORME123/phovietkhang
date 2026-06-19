import os
import re

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

oiva_pattern = r'<!-- Oiva Logo -->\s*<div class="mt-6">\s*<a href="https://www\.oivahymy\.fi[^>]*>\s*<img src="[^"]*oiva-logo[^"]*"[^>]*>\s*</a>\s*</div>'

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

            if 'Oiva Logo' in content or 'oivahymy' in content:
                # Remove the Oiva logo block
                new_content = re.sub(oiva_pattern, '', content, flags=re.IGNORECASE)
                
                # If there's any stray oivahymy links, remove them too
                new_content = re.sub(r'<a href="https://www\.oivahymy\.fi[^>]*>\s*<img[^>]*oiva[^>]*>\s*</a>', '', new_content, flags=re.IGNORECASE)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Removed Oiva from {filepath}")
