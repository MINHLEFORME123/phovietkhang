import os
import re

directories = [
    r"c:\Users\minhb\OneDrive\Desktop\phovietkhang",
    r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"
]

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return False
    
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    original = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated: {filepath}")
        return True
    else:
        print(f"No changes: {filepath}")
        return False

# Define common replacements
# 1. Obfuscated contact email in footers
obfuscated_replacements = [
    (r'data-user="contact"\s+data-domain="phovietkhang\.com"', 'data-user="phovietkhang2024" data-domain="gmail.com"'),
    (r'data-domain="phovietkhang\.com"\s+data-user="contact"', 'data-user="phovietkhang2024" data-domain="gmail.com"'),
    (r'contact\s+\[at\]\s+phovietkhang\s+\[dot\]\s+com', 'phovietkhang2024 [at] gmail [dot] com'),
]

# 2. careers@phovietkhang.com and press@phovietkhang.com in body
body_replacements = [
    (r'careers@phovietkhang\.com', 'phovietkhang2024@gmail.com'),
    (r'press@phovietkhang\.com', 'phovietkhang2024@gmail.com'),
    (r'contact@phovietkhang\.com', 'phovietkhang2024@gmail.com'),
]

# Process folders
for d in directories:
    if not os.path.exists(d):
        print(f"Directory not found: {d}")
        continue
        
    print(f"\nProcessing directory: {d}")
    
    # Update index.html footer email first
    index_path = os.path.join(d, "index.html")
    replace_in_file(index_path, obfuscated_replacements)
    
    # Update careers.html body emails
    careers_path = os.path.join(d, "careers.html")
    replace_in_file(careers_path, body_replacements)
    replace_in_file(careers_path, obfuscated_replacements)
    
    # Update press.html body emails
    press_path = os.path.join(d, "press.html")
    replace_in_file(press_path, body_replacements)
    replace_in_file(press_path, obfuscated_replacements)
    
    # Update llms.txt
    llms_path = os.path.join(d, "llms.txt")
    replace_in_file(llms_path, body_replacements)

print("\nDone replacing emails. Please run sync_seo_footers.py next.")
