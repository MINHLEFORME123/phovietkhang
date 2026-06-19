import glob

html_files = glob.glob('c:/Users/minhb/OneDrive/Desktop/phovietkhang/*.html')

count = 0
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'images/oiva-logo.svg' in content:
        new_content = content.replace('images/oiva-logo.svg', 'images/oiva-logo.png')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1

print(f"Updated {count} files to use PNG.")
