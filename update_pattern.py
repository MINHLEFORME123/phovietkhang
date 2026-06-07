import os
import re

base_dir = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
assets_dir = os.path.join(base_dir, 'assets')

# 1. New Vân Mây (Seigaiha) SVG patterns
svg_dark = '''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">
    <circle cx="20" cy="20" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="10" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <circle cx="40" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
    <circle cx="40" cy="0" r="10" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
</svg>'''

svg_light = '''<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20">
    <circle cx="20" cy="20" r="20" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
    <circle cx="20" cy="20" r="10" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
    <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
    <circle cx="40" cy="0" r="20" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
    <circle cx="40" cy="0" r="10" fill="none" stroke="rgba(0,0,0,0.06)" stroke-width="1.5"/>
</svg>'''

with open(os.path.join(assets_dir, 'pattern-dark.svg'), 'w') as f:
    f.write(svg_dark)

with open(os.path.join(assets_dir, 'pattern-light.svg'), 'w') as f:
    f.write(svg_light)

# 2. Soften the white color in index.html and update sizes
index_path = os.path.join(base_dir, 'index.html')
with open(index_path, 'r', encoding='utf-8') as f:
    index_content = f.read()

light_css_replacement = '''    .bg-pattern-light {
        background-color: #f8f6f0 !important; /* Soft warm ivory to reduce brightness */
        background-image: url('assets/pattern-light.svg') !important;
        background-repeat: repeat;
        background-size: 80px 40px;
        background-attachment: fixed;
    }'''
index_content = re.sub(r'\.bg-pattern-light\s*\{[^}]*\}', light_css_replacement, index_content)

dark_css_replacement = '''    .bg-pattern-dark {
        background-color: #0b0f19 !important;
        background-image: url('assets/pattern-dark.svg') !important;
        background-repeat: repeat;
        background-size: 80px 40px;
        background-attachment: fixed;
    }'''
index_content = re.sub(r'\.bg-pattern-dark\s*\{[^}]*\}', dark_css_replacement, index_content)

index_content = re.sub(r'background-size:\s*400px;', r'background-size: 80px 40px;', index_content)

with open(index_path, 'w', encoding='utf-8') as f:
    f.write(index_content)

# 3. Update global.css sizes
css_path = os.path.join(base_dir, 'css', 'global.css')
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

global_css_replacement = r'''body.bg-\[\#0b0f19\] {
    background-color: #0b0f19 !important;
    background-image: url('../assets/pattern-dark.svg') !important;
    background-repeat: repeat;
    background-size: 80px 40px;
    background-attachment: fixed;
}'''
css_content = re.sub(r'body\.bg-\[\\#0b0f19\]\s*\{[^}]*\}', global_css_replacement, css_content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css_content)

print('Seigaiha pattern updated and brightness softened successfully.')
