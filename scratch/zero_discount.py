import os
import re

utils_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/utils.js'

with open(utils_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace discountPercent: X with discountPercent: 0
new_content = re.sub(r'discountPercent:\s*\d+', 'discountPercent: 0', content)

with open(utils_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Zeroed out discountPercent in utils.js")
