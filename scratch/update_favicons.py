import os, re

def update_favicons(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root:
            continue
        for file in files:
            if not file.endswith('.html'):
                continue
            filepath = os.path.join(root, file)
            
            rel_path = os.path.relpath(root, directory)
            if rel_path == '.':
                prefix = 'images/'
            else:
                depth = len(rel_path.split(os.sep))
                prefix = ('../' * depth) + 'images/'
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Remove ALL existing favicon/icon link tags
            content = re.sub(r'<link[^>]*rel=["\'](?:shortcut icon|icon|apple-touch-icon)["\'][^>]*>\n?', '', content)
            
            # Build new favicon tags (Google-compliant)
            new_tags = (
                f'<link rel="icon" type="image/x-icon" href="{prefix}favicon.ico">\n'
                f'<link rel="icon" type="image/png" sizes="48x48" href="{prefix}favicon-48x48.png">\n'
                f'<link rel="icon" type="image/png" sizes="32x32" href="{prefix}favicon-32x32.png">\n'
                f'<link rel="icon" type="image/png" sizes="16x16" href="{prefix}favicon-16x16.png">\n'
                f'<link rel="apple-touch-icon" sizes="180x180" href="{prefix}apple-touch-icon.png">\n'
            )
            
            # Insert before <title> tag
            if '<title>' in content:
                content = content.replace('<title>', new_tags + '<title>', 1)
            elif '</head>' in content:
                content = content.replace('</head>', new_tags + '</head>', 1)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

update_favicons(r'C:\Users\minhb\OneDrive\Desktop\phovietkhang')
update_favicons(r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang')
print('Updated all HTML files with Google-compliant favicons!')
