import os

auth_js_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/auth.js'

with open(auth_js_path, 'r', encoding='utf-8') as f:
    auth_js = f.read()

if 'window.userProfileDocData = data;' in auth_js:
    if 'window.refreshChatGreeting && window.refreshChatGreeting();' not in auth_js:
        auth_js = auth_js.replace(
            'window.userProfileDocData = data;',
            'window.userProfileDocData = data;\n                    if (window.refreshChatGreeting) window.refreshChatGreeting();'
        )
        with open(auth_js_path, 'w', encoding='utf-8') as f:
            f.write(auth_js)
        print("Updated auth.js to refresh chat greeting.")
    else:
        print("Already updated.")
else:
    print("Could not find insertion point.")
