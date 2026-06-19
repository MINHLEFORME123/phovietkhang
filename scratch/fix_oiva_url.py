import os
import glob

html_files = glob.glob('c:/Users/minhb/OneDrive/Desktop/phovietkhang/*.html')

count = 0
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    old_url = 'https://www.oivahymy.fi/wp-content/themes/oiva/images/oiva-logo.svg'
    new_url = 'images/oiva-logo.svg'
    
    if old_url in content:
        new_content = content.replace(old_url, new_url)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1

print(f"Fixed Oiva logo in {count} files.")
