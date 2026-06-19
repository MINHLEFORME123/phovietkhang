import os
import subprocess

admin_js_dir = r'c:\Users\minhb\OneDrive\Desktop\phovietkhang\js\admin'

print("Checking JS syntax in admin folder...")
for file in os.listdir(admin_js_dir):
    if file.endswith('.js'):
        filepath = os.path.join(admin_js_dir, file)
        result = subprocess.run(['node', '-c', filepath], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error in {file}:\n{result.stderr}")
print("Check complete.")
