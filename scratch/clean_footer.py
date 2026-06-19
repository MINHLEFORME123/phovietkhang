import os

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

ugly_snippet_start = '<div class="md:col-span-1 mt-8 md:mt-0 px-4 md:px-0">'
ugly_snippet_end = '<!-- Copyright -->'

sleek_social_snippet = """  <div class="md:col-span-1 mt-8 md:mt-0">
    <div class="flex gap-5 items-center">
      <a href="https://facebook.com/phovietkhang" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors duration-300" aria-label="Facebook">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
      </a>
      <a href="https://instagram.com/phovietkhang" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors duration-300" aria-label="Instagram">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      </a>
      <a href="https://www.tripadvisor.com" target="_blank" rel="noopener noreferrer" class="text-tertiary-fixed-dim hover:text-white transition-colors duration-300" aria-label="TripAdvisor">
        <svg class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M22.84 10.87c-1.37-3.92-4.47-7-8.39-8.38A11.75 11.75 0 0 0 12 2a11.75 11.75 0 0 0-2.45.26 12.02 12.02 0 0 0-8.38 8.38A11.75 11.75 0 0 0 2 12c0 2.18.6 4.22 1.64 5.95l-1.35 1.35a1 1 0 0 0 .7 1.71h3.08A11.86 11.86 0 0 0 12 22a11.75 11.75 0 0 0 2.45-.26 12.02 12.02 0 0 0 8.38-8.38c.18-.78.26-1.6.26-2.45s-.08-1.67-.25-2.04zM12 4c3.08 0 5.86 1.74 7.23 4.41l-2.04.85C16.14 7.28 14.18 6 12 6s-4.14 1.28-5.19 3.26l-2.04-.85C6.14 5.74 8.92 4 12 4zm-4.5 9c-1.38 0-2.5-1.12-2.5-2.5S6.12 8 7.5 8s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm9 0c-1.38 0-2.5-1.12-2.5-2.5S15.12 8 16.5 8s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM12 14c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </a>
    </div>
  </div>
  <!-- Copyright -->"""

for d in directories:
    if not os.path.exists(d):
        continue
        
    html_files = [f for f in os.listdir(d) if f.endswith('.html')]
    for filename in html_files:
        filepath = os.path.join(d, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Find the block and replace
        if ugly_snippet_start in content:
            # We need to replace from ugly_snippet_start up to <!-- Copyright -->
            # Use string split or regex
            import re
            pattern = r'<div class="md:col-span-1 mt-8 md:mt-0 px-4 md:px-0">.*?<!-- Copyright -->'
            content = re.sub(pattern, sleek_social_snippet, content, flags=re.DOTALL)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
        
    print(f"Cleaned footer in {d}")
