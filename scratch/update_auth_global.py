import os

auth_js_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/auth.js'

with open(auth_js_path, 'r', encoding='utf-8') as f:
    auth_js = f.read()

replacement = '''
            if (userDoc.exists()) {
                role = userDoc.data().role || 'customer';
                window.userProfileDocData = userDoc.data();
                if (window.refreshChatGreeting) window.refreshChatGreeting();
                sessionStorage.removeItem('pendingWelcomeSpin');
'''

auth_js = auth_js.replace('''
            if (userDoc.exists()) {
                role = userDoc.data().role || 'customer';
                sessionStorage.removeItem('pendingWelcomeSpin');
''', replacement)

with open(auth_js_path, 'w', encoding='utf-8') as f:
    f.write(auth_js)

print("Updated auth.js")
