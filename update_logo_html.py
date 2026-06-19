import os
import re

def update_logo(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                
                rel_path = os.path.relpath(root, directory)
                if rel_path == '.':
                    prefix = 'images/logo.png'
                else:
                    depth = len(rel_path.split(os.sep))
                    prefix = ('../' * depth) + 'images/logo.png'
                    
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                nav_img = f'<img src="{prefix}" alt="Ph? Vi?t Khang Logo" class="w-10 h-10 object-contain rounded-full bg-white">'
                content = re.sub(r'<span class="material-symbols-outlined text-\[32px\][^>]*>\s*ramen_dining\s*</span>', nav_img, content)

                footer_img = f'<img src="{prefix}" alt="Ph? Vi?t Khang Logo" class="w-14 h-14 object-contain rounded-full bg-white">'
                content = re.sub(r'<span class="material-symbols-outlined text-5xl"[^>]*>\s*ramen_dining\s*</span>', footer_img, content)

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)

update_logo(r'C:\Users\minhb\OneDrive\Desktop\phovietkhang')
update_logo(r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang')
print('Updated logo on all files!')
