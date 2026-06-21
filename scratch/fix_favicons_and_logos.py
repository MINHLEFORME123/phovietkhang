import os
import re

def fix_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean existing favicon links
    # Matches any link tag with rel containing icon, apple-touch-icon, shortcut icon, etc.
    pattern_favicon = r'<link[^>]*rel=["\'](?:shortcut icon|icon|apple-touch-icon)["\'][^>]*>\n*'
    content = re.sub(pattern_favicon, '', content)

    # 2. Define the new correct favicon block with absolute paths
    new_favicons = (
        '    <link rel="shortcut icon" type="image/x-icon" href="/images/favicon.ico">\n'
        '    <link rel="icon" type="image/png" sizes="48x48" href="/images/favicon-48x48.png">\n'
        '    <link rel="icon" type="image/png" sizes="32x32" href="/images/favicon-32x32.png">\n'
        '    <link rel="icon" type="image/png" sizes="16x16" href="/images/favicon-16x16.png">\n'
        '    <link rel="apple-touch-icon" sizes="180x180" href="/images/apple-touch-icon.png">'
    )

    # Insert before <title> if present, otherwise before </head>
    if '<title>' in content:
        content = content.replace('<title>', new_favicons + '\n    <title>', 1)
    elif '</head>' in content:
        content = content.replace('</head>', new_favicons + '\n</head>', 1)

    # 3. Correct logo image paths to absolute /images/logo.png and fix encoding in alt
    # Matches src="..." where path ends in images/logo.png
    content = re.sub(
        r'src=["\'](?:\.\./)*images/logo\.png["\']',
        'src="/images/logo.png"',
        content
    )
    
    # Fix the corrupted alt tags from previous script (alt="Ph? Vi?t Khang Logo")
    content = content.replace('alt="Ph? Vi?t Khang Logo"', 'alt="Phở Việt Khang Logo"')
    content = content.replace('alt="Ph? Vi?t Khang Logo"', 'alt="Phở Việt Khang Logo"')

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
                    fix_html_file(filepath)
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
