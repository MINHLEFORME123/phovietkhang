import os

files = ['index.html', 'menu.html', 'locations.html', 'contact.html', 'reservations.html']
for f in files:
    if not os.path.exists(f):
        continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    register_btn = """<a class="hidden md:inline-flex border-2 border-primary text-primary font-body-sm text-body-sm font-semibold px-5 py-2 rounded-xl hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-sm" href="register.html" data-i18n="nav-register">
    Register
</a>
"""
    
    if 'data-i18n="nav-register"' not in content:
        # Find the reservations button to insert before it
        target = '<a class="hidden md:inline-flex bg-primary-container'
        if target in content:
            content = content.replace(target, register_btn + target)
            with open(f, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Added Register button to {f}")

