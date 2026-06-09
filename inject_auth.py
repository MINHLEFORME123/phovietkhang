import os

root_dir = '.'
html_files = [f for f in os.listdir(root_dir) if f.endswith('.html')]

for filename in html_files:
    fpath = os.path.join(root_dir, filename)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'js/auth.js' not in content:
        content = content.replace('</body>', '<script type="module" src="js/auth.js"></script>\n</body>')
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Injected auth.js into all root HTML files.")
