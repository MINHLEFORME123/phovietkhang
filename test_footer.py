import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

social_pattern = r'<div class="md:col-span-1 mt-8 md:mt-0">\s*<div class="flex gap-5 items-center">(.*?)</div>\s*</div>'
match = re.search(social_pattern, content, re.DOTALL)

if match:
    icons = match.group(1).strip()
    new_block = f'\n  <div class="flex gap-5 items-center mt-6">\n    {icons}\n  </div>\n'
    
    content = re.sub(social_pattern, '', content, flags=re.DOTALL)
    content = re.sub(r'(data-i18n="footer-desc">.*?</p>)', r'\1' + new_block, content, flags=re.DOTALL)
    
    with open('index_test.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Test successful")
else:
    print("Match not found")
