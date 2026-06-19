import os
import re

directory = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
github_directory = r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'

html_files = [f for f in os.listdir(directory) if f.endswith('.html') and f != 'index_test.html']

ga_script = """
    <!-- Google Analytics (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-H1DLYMFL1E"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-H1DLYMFL1E');
    </script>
"""

def inject_ga(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Avoid duplicate injection
    if 'googletagmanager.com/gtag/js' in content:
        print(f"GA already present in {os.path.basename(filepath)}")
        return

    # Inject right after <head> (or script tag inside head)
    if '<head>' in content:
        new_content = content.replace('<head>', '<head>' + ga_script, 1)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Injected GA in {os.path.basename(filepath)}")

for f in html_files:
    inject_ga(os.path.join(directory, f))
    inject_ga(os.path.join(github_directory, f))

print("Google Analytics injection completed!")
