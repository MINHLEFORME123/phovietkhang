import os

directory = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang'
html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

social_and_seo_snippet = """  <div class="md:col-span-1 mt-8 md:mt-0 px-4 md:px-0">
    <h3 class="text-white font-semibold mb-4 text-sm tracking-wide">CONNECT WITH US</h3>
    <div class="flex gap-4">
      <a href="https://facebook.com/phovietkhang" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors" aria-label="Facebook">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
      </a>
      <a href="https://instagram.com/phovietkhang" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors" aria-label="Instagram">
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </a>
      <a href="https://www.tripadvisor.com" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors" aria-label="TripAdvisor">
        <span class="material-symbols-outlined">travel_explore</span>
      </a>
      <a href="https://maps.google.com/?q=Pho+Viet+Khang+Helsinki" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors" aria-label="Google Maps">
        <span class="material-symbols-outlined">pin_drop</span>
      </a>
    </div>
    <p class="mt-5 font-body-sm text-tertiary-fixed-dim text-xs leading-relaxed max-w-sm drop-shadow-sm">
      Welcome to Phở Việt Khang, your premier destination for authentic Vietnamese cuisine in the heart of Helsinki. We pride ourselves on serving traditional family recipes, including our signature 24-hour slow-simmered Pho bone broth, crispy fresh spring rolls, and fragrant rice dishes. Whether you are joining us for a quick lunch, a family dinner, or celebrating a special occasion, our restaurant offers a warm, inviting atmosphere combined with exceptional culinary experiences. Discover the vibrant flavors of Asia right here in Finland. Our commitment to fresh ingredients, strict culinary precision, and a harmonious balance of herbs and spices ensures every dish is a masterpiece.
    </p>
  </div>
"""

for filename in html_files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add apple-touch-icon
    if 'apple-touch-icon' not in content:
        content = content.replace('<link rel="icon"', '<link rel="apple-touch-icon" sizes="180x180" href="images/favicon.svg">\n<link rel="icon"')
    
    # 2. Add social snippet to footer
    if 'CONNECT WITH US' not in content:
        # We find the links container in footer and insert the new social div right after it
        links_container_end_marker = '</div>\n  </div>\n  <!-- Copyright -->'
        
        # If the structure matches:
        if links_container_end_marker in content:
            content = content.replace(links_container_end_marker, f'</div>\n{social_and_seo_snippet}\n  </div>\n  <!-- Copyright -->')
        else:
            # Fallback replace
            content = content.replace('<!-- Copyright -->', f'{social_and_seo_snippet}\n  <!-- Copyright -->')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Injected apple-touch-icon, social sharing links, and SEO text to footer of all HTML files.")
