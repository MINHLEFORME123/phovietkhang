import os
import glob
import re

html_files = glob.glob('c:/Users/minhb/OneDrive/Desktop/phovietkhang/*.html')

oiva_html = """
                  <!-- Oiva Logo -->
                  <div class="mt-6">
                      <a href="https://www.oivahymy.fi/portaali/en/yrityshaku?kunta=Helsinki&nimi=Pho+Viet+Khang" target="_blank" rel="noopener noreferrer" title="View our Oiva report">
                          <img src="https://www.oivahymy.fi/wp-content/themes/oiva/images/oiva-logo.svg" alt="Oiva Certification" class="h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300 bg-white/10 p-1 rounded-md">
                      </a>
                  </div>"""

count = 0
for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we already added it to avoid duplicates
    if "Oiva Logo" in content:
        continue
        
    new_content = re.sub(r'(data-i18n="footer-desc">.*?Gastronomy\.\s*</p>)', r'\1' + oiva_html, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1

print(f"Added Oiva logo to {count} files.")
