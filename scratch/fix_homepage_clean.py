import re

# 1. Update index.html
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix navbar breakpoints
nav_start = html.find('<nav ')
nav_end = html.find('</nav>', nav_start)
if nav_start != -1 and nav_end != -1:
    nav_html = html[nav_start:nav_end]
    nav_html = nav_html.replace('lg:flex', 'xl:flex')
    nav_html = nav_html.replace('lg:inline-flex', 'xl:inline-flex')
    nav_html = nav_html.replace('lg:hidden', 'xl:hidden')
    html = html[:nav_start] + nav_html + html[nav_end:]

# Remove data-i18n from hero title and desc
html = re.sub(r'(<h1 id="hero-title"[^>]+?) data-i18n="hero-title"([^>]*>)', r'\1\2', html)
html = re.sub(r'(<p id="hero-desc"[^>]+?) data-i18n="hero-desc"([^>]*>)', r'\1\2', html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

# 2. Update js/homepage.js
with open('js/homepage.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Remove the title and desc nullifying hacks
js = re.sub(r'if \(lang === \'vi\' && title === "Tinh Hoa ?m Th?c Vi?t T?i Helsinki"\) title = null;\s*', '', js)
js = re.sub(r'if \(lang === \'vi\' && desc === "Mê món Vi?t\? Ghé ngay Ph? Vi?t Khang nhé! T?i mình n?u Ph? h?m xuong thom l?ng và các món an mang d?m ch?t du?ng ph? Vi?t Nam ngay t?i trung tâm Helsinki\."\) desc = null;\s*', '', js)

# Replace the SEO fallbacks with safe visual fallbacks
safe_title_fallback = "lang === 'vi' ? 'Tinh Hoa ?m Th?c Vi?t T?i Helsinki' : lang === 'fi' ? 'Aasialaisen Gastronomian Taidetta' : lang === 'sv' ? 'Den Asiatiska Gastronomin' : 'The Art of Asian Gastronomy'"
safe_desc_fallback = "lang === 'vi' ? 'Mê món Vi?t? Ghé ngay Ph? Vi?t Khang nhé! T?i mình n?u Ph? h?m xuong thom l?ng và các món an mang d?m ch?t du?ng ph? Vi?t Nam ngay t?i trung tâm Helsinki.' : lang === 'fi' ? 'Koe aidon vietnamilaisen katuruuan maku aivan Helsingin sydämessä.' : lang === 'sv' ? 'Upplev den sanna smaken av vietnamesisk gatumat mitt i hjärtat av Helsingfors.' : 'Experience the true taste of Vietnamese street food right in the heart of Helsinki.'"

js = js.replace("translations[lang]['hero-title']", safe_title_fallback)
js = js.replace("translations[lang]['hero-desc']", safe_desc_fallback)

with open('js/homepage.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Applied clean fixes.")
