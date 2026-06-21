import os
import re

def main():
    root_dir = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"
    target_pattern = r"(<meta\s+http-equiv=\"Content-Security-Policy\"\s+content=\"[^\"]*?)(;\s*frame-ancestors\s+'self'\s*)(;?\"[^>]*>)"
    
    count = 0
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and .git
        if "node_modules" in root or ".git" in root or ".idea" in root:
            continue
            
        for file in files:
            if file.endswith(".html"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    if "frame-ancestors" in content:
                        new_content = re.sub(target_pattern, r"\1\3", content)
                        # Just in case there's another variation
                        new_content = new_content.replace("; frame-ancestors 'self';", ";")
                        new_content = new_content.replace(";frame-ancestors 'self';", ";")
                        new_content = new_content.replace(" frame-ancestors 'self';", "")
                        new_content = new_content.replace("frame-ancestors 'self';", "")
                        new_content = new_content.replace(";;", ";")
                        
                        if new_content != content:
                            with open(path, "w", encoding="utf-8") as f:
                                f.write(new_content)
                            print(f"Fixed CSP in: {os.path.relpath(path, root_dir)}")
                            count += 1
                except Exception as e:
                    print(f"Error processing {path}: {e}")
                    
    print(f"Done! Updated {count} HTML files.")

if __name__ == "__main__":
    main()
