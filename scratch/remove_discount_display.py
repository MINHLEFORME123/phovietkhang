import re

# 1. Update profile.html
profile_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/profile.html'
with open(profile_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace `- ${tierConfig.discount}` or `-${tierConfig.discount}` with empty string
content = content.replace('-${tierConfig.discount}', '')
content = content.replace('- ${tierConfig.discount}', '')

with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated profile.html")

# 2. Update user-manager.js
user_manager_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/user-manager.js'
with open(user_manager_path, 'r', encoding='utf-8') as f:
    um_content = f.read()

# Remove the line rendering the discount
um_content = re.sub(r'\$\{tier\.discountPercent > 0 \? `\(-?\$\{tier\.discountPercent\}%\)` : \'\'\}', '', um_content)

with open(user_manager_path, 'w', encoding='utf-8') as f:
    f.write(um_content)

print("Updated user-manager.js")
