import os
import re

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"

for fname in os.listdir(ROOT):
    if fname.endswith(".html"):
        fpath = os.path.join(ROOT, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check for Toggle Menu click listener in script
        if "Toggle Menu" in content and "addEventListener" in content:
            print(f"Found listener in {fname}")
            # print script tags
            scripts = re.findall(r"<script>.*?</script>", content, re.DOTALL)
            for s in scripts:
                if "Toggle Menu" in s or "mobile-menu" in s:
                    print(f"  Script: {s}")
