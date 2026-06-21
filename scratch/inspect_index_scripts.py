with open(r"c:\Users\minhb\OneDrive\Desktop\phovietkhang\index.html", "r", encoding="utf-8") as f:
    content = f.read()

import re
scripts = re.findall(r"<script>.*?</script>", content, re.DOTALL)
for idx, s in enumerate(scripts):
    if "Toggle Menu" in s or "mobile-menu" in s:
        print(f"Script {idx}:")
        print(s)
