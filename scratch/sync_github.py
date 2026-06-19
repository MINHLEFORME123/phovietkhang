import os
import shutil

src_dir = r"C:\Users\minhb\OneDrive\Desktop\phovietkhang"
dst_dir = r"C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang"

def sync_folders():
    for item in os.listdir(src_dir):
        # Exclude directories
        if item in ['.git', 'node_modules', '.gemini', 'scratch']:
            continue
            
        s = os.path.join(src_dir, item)
        d = os.path.join(dst_dir, item)
        
        if os.path.isdir(s):
            if not os.path.exists(d):
                os.makedirs(d)
            # Copy all files inside directory
            for root, _, files in os.walk(s):
                for f in files:
                    s_file = os.path.join(root, f)
                    rel_path = os.path.relpath(s_file, src_dir)
                    d_file = os.path.join(dst_dir, rel_path)
                    
                    d_dir = os.path.dirname(d_file)
                    if not os.path.exists(d_dir):
                        os.makedirs(d_dir)
                        
                    shutil.copy2(s_file, d_file)
        else:
            shutil.copy2(s, d)
            
    print("Sync complete.")

sync_folders()
