import re

file_path = 'js/homepage.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the fallback to translations[lang]['hero-title'] with a short visual title.
# We can just define a small dictionary in JS or use Python to inject the hardcoded fallbacks.

# Let's replace the whole updateHeroText function.
# Actually, the easiest is to just find translations[lang]['hero-title'] and replace it with a short fallback based on lang.

short_titles = "lang === 'vi' ? 'Tinh Hoa ?m Th?c Vi?t T?i Helsinki' : lang === 'fi' ? 'Aasialaisen Gastronomian Taidetta' : lang === 'sv' ? 'Den Asiatiska Gastronomin' : 'The Art of Asian Gastronomy'"

content = content.replace("translations[lang]['hero-title']", short_titles)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed hero title fallbacks in homepage.js')
