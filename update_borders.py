import os
import re

base_dir = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'

# 1. Update backgrounds in customer pages
customer_pages = ['menu.html', 'locations.html', 'contact.html', 'reservations.html']

for page in customer_pages:
    path = os.path.join(base_dir, page)
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace googleusercontent urls
        content = re.sub(r"url\('https://lh3\.googleusercontent\.com/aida/[^']*'\)", r"url('assets/pattern-dark.svg')", content)
        content = re.sub(r"background-size:\s*400px;", r"background-size: 80px 40px;", content)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

# 2. Add blue borders in index.html
index_path = os.path.join(base_dir, 'index.html')
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    
    # Add border to story image
    idx_content = idx_content.replace(
        'class="w-full h-[500px] object-cover rounded-DEFAULT"',
        'class="w-full h-[500px] object-cover rounded-DEFAULT border-2 border-primary shadow-lg shadow-primary/20"'
    )
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(idx_content)

# 3. Add blue borders to signature dish cards in js/homepage.js
hp_path = os.path.join(base_dir, 'js', 'homepage.js')
if os.path.exists(hp_path):
    with open(hp_path, 'r', encoding='utf-8') as f:
        hp_content = f.read()
    
    # Replace border-outline-variant with border-2 border-primary
    hp_content = hp_content.replace('border border-outline-variant', 'border-2 border-primary shadow-md shadow-primary/10')
    
    with open(hp_path, 'w', encoding='utf-8') as f:
        f.write(hp_content)

print('Backgrounds and blue borders updated successfully.')
