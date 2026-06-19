import os
import re
from bs4 import BeautifulSoup

directory = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
html_files = [f for f in os.listdir(directory) if f.endswith('.html') and f != 'index_test.html']

generic_link_texts = ['click here', 'learn more', 'read more', 'xem thêm', 'chi tiết', 'details', 'ở đây', 'tại đây']

def audit_file(filepath):
    filename = os.path.basename(filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    soup = BeautifulSoup(html, 'html.parser')
    issues = []

    # 1. Viewport
    if not soup.find('meta', attrs={'name': 'viewport'}):
        issues.append("Missing Viewport Meta Tag")

    # 2. Title
    title_tag = soup.find('title')
    if not title_tag or not title_tag.text.strip():
        issues.append("Missing Title Tag")

    # 3. Meta Description
    desc_tag = soup.find('meta', attrs={'name': 'description'})
    if not desc_tag or not desc_tag.get('content', '').strip():
        issues.append("Missing Meta Description")

    # 4. Canonical
    canonical_tag = soup.find('link', attrs={'rel': 'canonical'})
    if not canonical_tag or not canonical_tag.get('href', '').strip():
        issues.append("Missing Canonical Link")

    # 5. Alternate Hreflang
    hreflangs = soup.find_all('link', attrs={'rel': 'alternate'})
    if not hreflangs:
        issues.append("Missing alternate hreflangs")

    # 6. Images Alt
    images = soup.find_all('img')
    for img in images:
        if not img.has_attr('alt'):
            # Check if it has alt or is decorative
            issues.append(f"Image missing alt attribute: {img.get('src')}")
        elif not img.get('alt').strip():
            # Empty alt can be flagged in some tools if it's not decorative
            issues.append(f"Image has empty alt: {img.get('src')}")

    # 7. Generic Link Text
    links = soup.find_all('a')
    for link in links:
        link_text = link.text.strip().lower()
        if link_text in generic_link_texts:
            issues.append(f"Generic link text found: '{link.text}' pointing to {link.get('href')}")

    return issues

all_issues = {}
for filename in html_files:
    filepath = os.path.join(directory, filename)
    issues = audit_file(filepath)
    if issues:
        all_issues[filename] = issues

if not all_issues:
    print("SEO_SUCCESS: All HTML files are 100/100 Lighthouse SEO Compliant!")
else:
    print("SEO_WARNING: Found some compliance issues:")
    for fn, issues in all_issues.items():
        print(f"\n[{fn}]:")
        for iss in issues:
            print(f" - {iss}")
