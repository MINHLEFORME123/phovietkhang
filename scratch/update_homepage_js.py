import re

file_path = 'js/homepage.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove old caching blocks
hero_cache_pattern = r'if \(config\.heroTitleVi\) localStorage\.setItem\(\'cachedHeroTitle_vi\'.*?else localStorage\.removeItem\(\'cachedHeroDesc_sv\'\);'
content = re.sub(hero_cache_pattern, '', content, flags=re.DOTALL)

sig_cache_pattern = r'if \(config\.signatureTitleVi\) localStorage\.setItem\(\'cachedSignatureTitle_vi\'.*?else localStorage\.removeItem\(\'cachedSignatureDesc_sv\'\);'
content = re.sub(sig_cache_pattern, '', content, flags=re.DOTALL)

story_cache_pattern = r'if \(config\.storyLabelVi\) localStorage\.setItem\(\'cachedStoryLabel_vi\'.*?else localStorage\.removeItem\(\'cachedStoryP2_sv\'\);'
content = re.sub(story_cache_pattern, '', content, flags=re.DOTALL)

cta_cache_pattern = r'if \(config\.ctaTitleVi\) localStorage\.setItem\(\'cachedCtaTitle_vi\'.*?else localStorage\.removeItem\(\'cachedCtaDesc_sv\'\);'
content = re.sub(cta_cache_pattern, '', content, flags=re.DOTALL)

# Now, we need to inject localStorage.setItem inside the updateText functions.
# We will use regex to find where textContent is assigned, and append the localStorage code.

def add_cache(match):
    # match.group(1) is the element ID, e.g. 'hero-title'
    # match.group(2) is the value being assigned
    elem_id = match.group(1)
    val = match.group(2)
    # Convert 'hero-title' to 'cachedHeroTitle'
    cache_key_map = {
        'hero-title': 'cachedHeroTitle',
        'hero-desc': 'cachedHeroDesc',
        'signature-title': 'cachedSignatureTitle',
        'signature-desc': 'cachedSignatureDesc',
        'story-label': 'cachedStoryLabel',
        'story-title': 'cachedStoryTitle',
        'story-p1': 'cachedStoryP1',
        'story-p2': 'cachedStoryP2',
        'cta-title': 'cachedCtaTitle',
        'cta-desc': 'cachedCtaDesc'
    }
    # This is tricky because the assignments are generic in the code.
    return match.group(0)

# Instead of complex regex, let's just do simple replacements.

replacements = [
    (
        "titleElem.textContent = title;",
        "titleElem.textContent = title; localStorage.setItem('cachedHeroTitle_' + lang, title);"
    ),
    (
        "titleElem.textContent = translations[lang]['hero-title'];",
        "titleElem.textContent = translations[lang]['hero-title']; localStorage.setItem('cachedHeroTitle_' + lang, translations[lang]['hero-title']);"
    ),
    (
        "descElem.textContent = desc;",
        "descElem.textContent = desc; localStorage.setItem('cachedHeroDesc_' + lang, desc);"
    ),
    (
        "descElem.textContent = translations[lang]['hero-desc'];",
        "descElem.textContent = translations[lang]['hero-desc']; localStorage.setItem('cachedHeroDesc_' + lang, translations[lang]['hero-desc']);"
    ),
    (
        "sigTitleElem.textContent = title;",
        "sigTitleElem.textContent = title; localStorage.setItem('cachedSignatureTitle_' + lang, title);"
    ),
    (
        "sigTitleElem.textContent = translations[lang]['sig-title'];",
        "sigTitleElem.textContent = translations[lang]['sig-title']; localStorage.setItem('cachedSignatureTitle_' + lang, translations[lang]['sig-title']);"
    ),
    (
        "sigDescElem.textContent = desc;",
        "sigDescElem.textContent = desc; localStorage.setItem('cachedSignatureDesc_' + lang, desc);"
    ),
    (
        "sigDescElem.textContent = translations[lang]['sig-desc'];",
        "sigDescElem.textContent = translations[lang]['sig-desc']; localStorage.setItem('cachedSignatureDesc_' + lang, translations[lang]['sig-desc']);"
    ),
    (
        "storyLabelElem.textContent = label;",
        "storyLabelElem.textContent = label; localStorage.setItem('cachedStoryLabel_' + lang, label);"
    ),
    (
        "storyLabelElem.textContent = translations[lang]['story-label'];",
        "storyLabelElem.textContent = translations[lang]['story-label']; localStorage.setItem('cachedStoryLabel_' + lang, translations[lang]['story-label']);"
    ),
    (
        "storyTitleElem.textContent = title;",
        "storyTitleElem.textContent = title; localStorage.setItem('cachedStoryTitle_' + lang, title);"
    ),
    (
        "storyTitleElem.textContent = translations[lang]['story-title'];",
        "storyTitleElem.textContent = translations[lang]['story-title']; localStorage.setItem('cachedStoryTitle_' + lang, translations[lang]['story-title']);"
    ),
    (
        "storyP1Elem.textContent = p1;",
        "storyP1Elem.textContent = p1; localStorage.setItem('cachedStoryP1_' + lang, p1);"
    ),
    (
        "storyP1Elem.textContent = translations[lang]['story-p1'];",
        "storyP1Elem.textContent = translations[lang]['story-p1']; localStorage.setItem('cachedStoryP1_' + lang, translations[lang]['story-p1']);"
    ),
    (
        "storyP2Elem.textContent = p2;",
        "storyP2Elem.textContent = p2; localStorage.setItem('cachedStoryP2_' + lang, p2);"
    ),
    (
        "storyP2Elem.textContent = translations[lang]['story-p2'];",
        "storyP2Elem.textContent = translations[lang]['story-p2']; localStorage.setItem('cachedStoryP2_' + lang, translations[lang]['story-p2']);"
    ),
    (
        "ctaTitleElem.textContent = title;",
        "ctaTitleElem.textContent = title; localStorage.setItem('cachedCtaTitle_' + lang, title);"
    ),
    (
        "ctaTitleElem.textContent = translations[lang]['cta-title'];",
        "ctaTitleElem.textContent = translations[lang]['cta-title']; localStorage.setItem('cachedCtaTitle_' + lang, translations[lang]['cta-title']);"
    ),
    (
        "ctaDescElem.textContent = desc;",
        "ctaDescElem.textContent = desc; localStorage.setItem('cachedCtaDesc_' + lang, desc);"
    ),
    (
        "ctaDescElem.textContent = translations[lang]['cta-desc'];",
        "ctaDescElem.textContent = translations[lang]['cta-desc']; localStorage.setItem('cachedCtaDesc_' + lang, translations[lang]['cta-desc']);"
    )
]

for old_str, new_str in replacements:
    content = content.replace(old_str, new_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated js/homepage.js with correct FOUC caching logic.')
