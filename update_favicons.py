import os
import re

directory = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"

for root, dirs, files in os.walk(directory):
    if 'node_modules' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith(".html"):
            filepath = os.path.join(root, file)
            
            rel_path = os.path.relpath(root, directory)
            if rel_path == '.':
                prefix = 'images/logo.png'
            else:
                depth = len(rel_path.split(os.sep))
                prefix = ('../' * depth) + 'images/logo.png'
                
            new_tags = f'<link rel="apple-touch-icon" sizes="180x180" href="{prefix}">\n<link rel="icon" type="image/png" sizes="32x32" href="{prefix}">\n<link rel="icon" type="image/png" sizes="16x16" href="{prefix}">'

            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            content = re.sub(r'<link[^>]*rel=["\'](?:shortcut icon|icon|apple-touch-icon)["\'][^>]*>\n*', '', content)

            if '<title>' in content:
                content = content.replace('<title>', new_tags + '\n<title>')
            elif '</head>' in content:
                content = content.replace('</head>', new_tags + '\n</head>')

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

print("Updated all HTML files.")
