import os

directory = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
github_directory = r'C:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'

html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

target_content = """            <div class="flex flex-col gap-2 px-4 pt-3 border-t border-white/5">
                <a id="nav-register-btn-mobile" class="w-full text-center border-2 border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white hover:text-black transition-all" href="register.html" data-i18n="nav-register">Register</a>
                <a class="w-full text-center bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all" href="reservations.html" data-i18n="nav-reservations">Reservations</a>
            </div>"""

replacement_content = """            <div class="flex flex-col gap-2 px-4 pt-3 border-t border-white/5">
                <a id="nav-register-btn-mobile" class="w-full text-center border-2 border-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white hover:text-black transition-all" href="register.html" data-i18n="nav-register-mobile">Create Account</a>
                <a class="w-full text-center bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-all" href="reservations.html" data-i18n="nav-reservations-mobile">Book Table</a>
            </div>"""

def fix_mobile_nav(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Normalize newlines for match
    normalized_content = content.replace('\r\n', '\n')
    normalized_target = target_content.replace('\r\n', '\n')
    normalized_replacement = replacement_content.replace('\r\n', '\n')

    if normalized_target in normalized_content:
        new_content = normalized_content.replace(normalized_target, normalized_replacement)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed mobile nav in {os.path.basename(filepath)}")

for f in html_files:
    fix_mobile_nav(os.path.join(directory, f))
    fix_mobile_nav(os.path.join(github_directory, f))

print("All mobile nav anchors updated!")
