import re
import os

ROOT = r"c:\Users\minhb\OneDrive\Desktop\phovietkhang"
INDEX = os.path.join(ROOT, "index.html")

with open(INDEX, "r", encoding="utf-8") as f:
    content = f.read()

# Hero Title
content = re.sub(r'(id="hero-title"\s+class=")([^"]+)', r'\1\2 animate-on-scroll', content)

# Hero Desc
content = re.sub(r'(id="hero-desc"\s+class=")([^"]+)', r'\1\2 animate-on-scroll delay-100', content)

# Hero Button
content = re.sub(r'(href="/reservations"\s+data-i18n="hero-reserve")([^>]*class=")([^"]+)', r'\1\2\3 animate-on-scroll delay-200', content)
# Since the button class doesn't have an id, I'll match the specific button:
# <a class="inline-flex items-center justify-center ... transition-all duration-300 border border-outline-variant/30" href="/reservations" data-i18n="hero-reserve">
content = content.replace('class="inline-flex items-center justify-center bg-surface-container-lowest text-primary font-body-sm text-body-sm font-semibold px-8 py-4 hover:bg-surface-container-high rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-outline-variant/30"', 
                          'class="inline-flex items-center justify-center bg-surface-container-lowest text-primary font-body-sm text-body-sm font-semibold px-8 py-4 hover:bg-surface-container-high rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-outline-variant/30 animate-on-scroll delay-200"')

# Story Section
content = content.replace('<span id="story-label" class="inline-block font-label-caps text-label-caps tracking-widest text-secondary uppercase mb-6"',
                          '<span id="story-label" class="inline-block font-label-caps text-label-caps tracking-widest text-secondary uppercase mb-6 animate-on-scroll"')

content = content.replace('<h2 id="story-title" class="font-headline-md text-headline-md text-primary mb-8"',
                          '<h2 id="story-title" class="font-headline-md text-headline-md text-primary mb-8 animate-on-scroll delay-100"')

content = content.replace('<p id="story-p1" class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6"',
                          '<p id="story-p1" class="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-6 animate-on-scroll delay-200"')

content = content.replace('<p id="story-p2" class="font-body-md text-body-md text-on-surface-variant leading-relaxed"',
                          '<p id="story-p2" class="font-body-md text-body-md text-on-surface-variant leading-relaxed animate-on-scroll delay-300"')

# Bento Grid
# <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[250px] md:auto-rows-[300px]">
content = re.sub(r'(<div class="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500.*?)(>)', r'\1 animate-on-scroll\2', content)

# Re-match bento grid to add delays based on order
pieces = content.split('animate-on-scroll')
new_content = pieces[0]
delay = 100
for i in range(1, len(pieces)):
    if 'group relative rounded-2xl' in pieces[i-1]:
        new_content += f'animate-on-scroll delay-{delay}' + pieces[i]
        delay += 100
        if delay > 400: delay = 100
    else:
        new_content += 'animate-on-scroll' + pieces[i]

content = new_content

with open(INDEX, "w", encoding="utf-8") as f:
    f.write(content)
print("Added animation classes to index.html")
