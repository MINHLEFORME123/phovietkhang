import os
import glob

html_files = glob.glob('*.html')
count = 0

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    nav_start = content.find('<nav aria-label="Main Navigation"')
    if nav_start == -1:
        # Some pages might not have aria-label="Main Navigation", try just <nav
        nav_start = content.find('<nav ')
    
    if nav_start != -1:
        nav_end = content.find('</nav>', nav_start)
        if nav_end != -1:
            nav_html = content[nav_start:nav_end]
            
            original_nav = nav_html
            # Replace lg:flex with xl:flex
            nav_html = nav_html.replace('lg:flex', 'xl:flex')
            # Replace lg:inline-flex with xl:inline-flex
            nav_html = nav_html.replace('lg:inline-flex', 'xl:inline-flex')
            # Replace lg:hidden with xl:hidden
            nav_html = nav_html.replace('lg:hidden', 'xl:hidden')
            
            if nav_html != original_nav:
                content = content[:nav_start] + nav_html + content[nav_end:]
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1

print(f'Updated navbar breakpoints from lg to xl in {count} HTML files.')
