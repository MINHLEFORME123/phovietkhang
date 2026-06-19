import os
import re

auth_file = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/auth.js'

with open(auth_file, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'const rates = \{[^}]+\};',
    "const rates = { bronze: 0, silver: 0.02, gold: 0.05, platinum: 0.10, diamond: 0.15 };",
    content
)

with open(auth_file, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated rates in auth.js")
