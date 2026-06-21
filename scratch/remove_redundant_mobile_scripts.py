import os
import re

def clean_mobile_script(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match the script block containing the toggle mobile menu click listener
    # It accounts for varying indentation and whitespace
    pattern = r'\s*<script>\s*document\.addEventListener\(\'DOMContentLoaded\',\s*\(\)\s*=>\s*\{\s*const\s+mobileBtn\s*=\s*document\.querySelector\(\'\[aria-label="Toggle Menu"\]\'\);\s*const\s+mobileMenu\s*=\s*document\.getElementById\(\'mobile-menu\'\);\s*if\s*\(\s*mobileBtn\s*&&\s*mobileMenu\s*\)\s*\{\s*mobileBtn\.addEventListener\(\'click\',\s*\(\)\s*=>\s*\{\s*const\s+isHidden\s*=\s*mobileMenu\.classList\.contains\(\'hidden\'\);\s*mobileMenu\.classList\.toggle\(\'hidden\',\s*!isHidden\);\s*mobileBtn\.setAttribute\(\'aria-expanded\',\s*isHidden\.toString\(\)\);\s*\}\);\s*\}\s*\};\s*\);\s*</script>'
    
    # Let's write a more flexible regex that handles different spacing and single vs double quotes
    pattern_flex = r'\s*<script>\s*document\.addEventListener\(\s*[\'"]DOMContentLoaded[\'"]\s*,\s*\(\)\s*=>\s*\{\s*const\s+mobileBtn\s*=\s*document\.querySelector\(\s*[\'"]\[aria-label="Toggle Menu"\][\'"]\s*\);\s*const\s+mobileMenu\s*=\s*document\.getElementById\(\s*[\'"]mobile-menu[\'"]\s*\);\s*if\s*\(\s*mobileBtn\s*&&\s*mobileMenu\s*\)\s*\{\s*mobileBtn\.addEventListener\(\s*[\'"]click[\'"]\s*,\s*\(\)\s*=>\s*\{\s*const\s+isHidden\s*=\s*mobileMenu\.classList\.contains\(\s*[\'"]hidden[\'"]\s*\);\s*mobileMenu\.classList\.toggle\(\s*[\'"]hidden[\'"]\s*,\s*!isHidden\s*\);\s*mobileBtn\.setAttribute\(\s*[\'"]aria-expanded[\'"]\s*,\s*isHidden\.toString\(\s*\)\s*\);\s*\}\s*\);\s*\}\s*\}\s*\);\s*</script>'

    new_content, count = re.subn(pattern_flex, '', content)
    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.gemini' in root:
            continue
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    if clean_mobile_script(filepath):
                        print(f"Removed redundant mobile script from: {os.path.relpath(filepath, directory)}")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == "__main__":
    desktop_dir = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"
    github_dir = r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"
    
    print("Processing Desktop directory...")
    process_directory(desktop_dir)
    
    print("Processing GitHub directory...")
    process_directory(github_dir)
    
    print("Done!")
