import os
import re

def fix_css_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove existing global.css and client.css link tags
    # Matches <link ... href="...css/global.css" ...> or similar
    pattern_css = r'<link[^>]*href=["\'](?:\.\./)*css/(?:global|client)\.css["\'][^>]*>\n*'
    content = re.sub(pattern_css, '', content)

    # 2. Define the new absolute stylesheet links
    new_css_tags = (
        '    <link rel="stylesheet" href="/css/global.css">\n'
        '    <link rel="stylesheet" href="/css/client.css">'
    )

    # 3. Insert the new tags into the <head>
    # We place them before the first favicon link if possible, or before <title> or </head>
    if 'shortcut icon' in content:
        content = content.replace('<link rel="shortcut icon"', new_css_tags + '\n    <link rel="shortcut icon"', 1)
    elif '<title>' in content:
        content = content.replace('<title>', new_css_tags + '\n    <title>', 1)
    elif '</head>' in content:
        content = content.replace('</head>', new_css_tags + '\n</head>', 1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.gemini' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    fix_css_in_file(filepath)
                    print(f"Fixed CSS links in: {os.path.relpath(filepath, directory)}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    desktop_dir = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"
    github_dir = r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"
    
    print("Fixing Desktop directory...")
    process_directory(desktop_dir)
    
    print("Fixing GitHub directory...")
    process_directory(github_dir)
    
    print("Done!")
