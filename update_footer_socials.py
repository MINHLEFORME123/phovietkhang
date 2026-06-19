import os
import re

def fix_footer(directory):
    social_pattern = r'<div class="md:col-span-1 mt-8 md:mt-0">\s*<div class="flex gap-5 items-center">(.*?)</div>\s*</div>'
    
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                match = re.search(social_pattern, content, re.DOTALL)
                if match:
                    icons = match.group(1).strip()
                    new_block = f'\n  <div class="flex gap-5 items-center mt-6">\n    {icons}\n  </div>\n'
                    
                    content = re.sub(social_pattern, '', content, flags=re.DOTALL)
                    content = re.sub(r'(data-i18n="footer-desc">.*?</p>)', r'\1' + new_block, content, flags=re.DOTALL)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)

fix_footer(r'C:\Users\minhb\OneDrive\Desktop\phovietkhang')
fix_footer(r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang')
print("Successfully moved social icons in footer across all HTML files.")
