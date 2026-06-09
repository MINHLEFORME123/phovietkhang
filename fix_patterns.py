import os
import re

base_dir = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
assets_dir = os.path.join(base_dir, 'assets')
if not os.path.exists(assets_dir):
    os.makedirs(assets_dir)

svg_dark = '''<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
    <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    <circle cx="30" cy="30" r="8" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    <path d="M0 0L60 60 M60 0L0 60" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
</svg>'''

svg_light = '''<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
    <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
    <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(0,0,0,0.04)" stroke-width="1"/>
    <circle cx="30" cy="30" r="8" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
    <path d="M0 0L60 60 M60 0L0 60" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
</svg>'''

with open(os.path.join(assets_dir, 'pattern-dark.svg'), 'w') as f:
    f.write(svg_dark)

with open(os.path.join(assets_dir, 'pattern-light.svg'), 'w') as f:
    f.write(svg_light)

# 1. Update index.html
index_path = os.path.join(base_dir, 'index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

def replacer(match):
    start = max(0, match.start() - 150)
    context = index_content[start:match.start()]
    if 'bg-pattern-light' in context:
        return "url('assets/pattern-light.svg')"
    else:
        return "url('assets/pattern-dark.svg')"

index_content = re.sub(r"url\('https://lh3\.googleusercontent\.com/aida/[^']*'\)", replacer, index_content)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)

# 2. Update css/global.css
css_path = os.path.join(base_dir, 'css', 'global.css')
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

css_content = re.sub(r"url\('https://lh3\.googleusercontent\.com/aida/[^']*'\)", r"url('../assets/pattern-dark.svg')", css_content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print('Successfully replaced expiring URLs with local SVG patterns.')
