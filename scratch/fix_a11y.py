import os
import re

directory = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang'
html_files = [f for f in os.listdir(directory) if f.endswith('.html')]

# 1. Fix client.js chat toggle
client_js_path = os.path.join(directory, 'js', 'client.js')
if os.path.exists(client_js_path):
    with open(client_js_path, 'r', encoding='utf-8') as f:
        client_js = f.read()
    
    # Change <div class="pvk-chat-toggle-btn" to a button with proper aria attributes
    # The current string: <div class="pvk-chat-toggle-btn" id="client-chat-toggle" style="position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;transform:translateZ(0)!important;">
    # It might be split across lines, so we use regex or string replace.
    client_js = client_js.replace(
        '<div class="pvk-chat-toggle-btn" id="client-chat-toggle"',
        '<button class="pvk-chat-toggle-btn" id="client-chat-toggle" aria-label="Toggle AI Assistant" aria-expanded="false" aria-controls="client-chat-win" role="button"'
    )
    # Also need to close it as </button> instead of </div>.
    # The structure is:
    # <div class="pvk-chat-toggle-btn" id="client-chat-toggle" ...>
    #     <span class="material-symbols-outlined text-[28px]" id="client-chat-icon">chat</span>
    # </div>
    # Let's replace the specific block:
    old_chat_div = """<div class="pvk-chat-toggle-btn" id="client-chat-toggle" style="position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;transform:translateZ(0)!important;">
            <span class="material-symbols-outlined text-[28px]" id="client-chat-icon">chat</span>
        </div>"""
    new_chat_btn = """<button class="pvk-chat-toggle-btn cursor-pointer" id="client-chat-toggle" aria-label="Toggle AI Assistant" aria-expanded="false" aria-controls="client-chat-win" style="position:fixed!important;bottom:20px!important;right:20px!important;z-index:2147483647!important;transform:translateZ(0)!important;">
            <span class="material-symbols-outlined text-[28px]" id="client-chat-icon">chat</span>
        </button>"""
    client_js = client_js.replace(old_chat_div, new_chat_btn)
    
    # Close button aria-label
    client_js = client_js.replace('<button id="client-chat-close" class="text-secondary hover:text-white transition-colors">', '<button id="client-chat-close" aria-label="Close chat window" class="text-secondary hover:text-white transition-colors">')
    # Send button aria-label
    client_js = client_js.replace('<button id="client-chat-send" class="bg-primary', '<button id="client-chat-send" aria-label="Send message" class="bg-primary')
    
    with open(client_js_path, 'w', encoding='utf-8') as f:
        f.write(client_js)
    print("Updated client.js")

# 2. Fix HTML files
for filename in html_files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add aria-label to main nav
    content = content.replace('<nav class="fixed top-0', '<nav aria-label="Main Navigation" class="fixed top-0')
    
    # Add aria-label to User profile button
    content = content.replace('<a id="nav-user-btn" href="login.html" class="text-white hover:text-gray-300 transition-colors">', 
                              '<a id="nav-user-btn" href="login.html" aria-label="User Profile and Login" class="text-white hover:text-gray-300 transition-colors">')
    
    # Add aria-label to Cart button
    content = content.replace('<a href="cart.html" class="nav-cart-btn relative text-white hover:text-gray-300 transition-colors p-1" title="View Cart">',
                              '<a href="cart.html" class="nav-cart-btn relative text-white hover:text-gray-300 transition-colors p-1" aria-label="Shopping Cart" title="View Cart">')
                              
    # Add aria-label to mobile language toggles
    content = re.sub(r'<button class="w-8 h-8([^>]+)onclick="changeLanguage\(\'vi\'\)">', r'<button class="w-8 h-8\1aria-label="Tiếng Việt" onclick="changeLanguage(\'vi\')">', content)
    content = re.sub(r'<button class="w-8 h-8([^>]+)onclick="changeLanguage\(\'en\'\)">', r'<button class="w-8 h-8\1aria-label="English" onclick="changeLanguage(\'en\')">', content)
    content = re.sub(r'<button class="w-8 h-8([^>]+)onclick="changeLanguage\(\'fi\'\)">', r'<button class="w-8 h-8\1aria-label="Suomi" onclick="changeLanguage(\'fi\')">', content)
    content = re.sub(r'<button class="w-8 h-8([^>]+)onclick="changeLanguage\(\'sv\'\)">', r'<button class="w-8 h-8\1aria-label="Svenska" onclick="changeLanguage(\'sv\')">', content)
    
    # Ensure role=main on <main>
    content = content.replace('<main class=', '<main role="main" class=')
    # Ensure role=banner on <header> if exists
    content = content.replace('<header class=', '<header role="banner" class=')
    # Ensure role=contentinfo on <footer>
    content = content.replace('<footer class=', '<footer role="contentinfo" class=')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated HTML files for A11y.")
