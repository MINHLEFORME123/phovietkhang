import os
import subprocess

admin_js_dir = r'c:\Users\minhb\OneDrive\Desktop\phovietkhang\js\admin'
admin_html_dir = r'c:\Users\minhb\OneDrive\Desktop\phovietkhang\admin'

print("--- Syntax check ---")
for file in os.listdir(admin_js_dir):
    if file.endswith('.js'):
        filepath = os.path.join(admin_js_dir, file)
        result = subprocess.run(['node', '-c', filepath], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error in {file}:\n{result.stderr}")

print("--- Flex td layout bug check ---")
for root, dirs, files in os.walk(admin_js_dir):
    for file in files:
        if file.endswith('.js'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if '<td class="py-3 px-4 flex gap-2">' in content:
                    print(f"Found broken flex td in {file}")

print("--- HTML Script references check ---")
for file in os.listdir(admin_html_dir):
    if file.endswith('.html'):
        filepath = os.path.join(admin_html_dir, file)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if '<script type="module" src="../js/admin/main.js' not in content and '<script type="module" src="../js/admin.js' not in content:
                print(f"Missing main admin script in {file}")

