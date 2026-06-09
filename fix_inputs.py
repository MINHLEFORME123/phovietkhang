import os

files = ['login.html', 'register.html']
for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace the invalid class with a hardcoded hex color that matches the dark theme
        content = content.replace('bg-surface-container-low', 'bg-[#18202d]')
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)

print("Fixed input backgrounds in login and register.")
