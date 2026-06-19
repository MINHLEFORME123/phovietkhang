import os

client_js_path = 'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/client.js'

with open(client_js_path, 'r', encoding='utf-8') as f:
    client_js = f.read()

# I want to replace the part inside applyLangToChat:
target_code = '''        // If chat was already opened, reset conversation on language change
        if (chatInitialized) {
            chatMessages.length = 1; // Keep only system prompt
            const msgArea = document.getElementById('client-chat-messages');
            if (msgArea) {
                msgArea.innerHTML = '';
                const welcomeEl = document.createElement('div');
                welcomeEl.className = 'pvk-chat-bubble pvk-bubble-ai animate-fade-in';
                welcomeEl.id = 'client-chat-welcome-msg';
                welcomeEl.textContent = getWelcomeMessage(lang);
                msgArea.appendChild(welcomeEl);
            }
        }'''

new_code = '''        // Update welcome message DOM element if it exists
        const welcomeEl = document.getElementById('client-chat-welcome-msg');
        if (welcomeEl) {
            welcomeEl.textContent = getWelcomeMessage(lang);
        }

        // If chat was already opened, reset conversation on language change
        if (chatInitialized) {
            chatMessages.length = 1; // Keep only system prompt
            const msgArea = document.getElementById('client-chat-messages');
            if (msgArea && !msgArea.contains(welcomeEl)) {
                msgArea.innerHTML = '';
                const newWelcomeEl = document.createElement('div');
                newWelcomeEl.className = 'pvk-chat-bubble pvk-bubble-ai animate-fade-in';
                newWelcomeEl.id = 'client-chat-welcome-msg';
                newWelcomeEl.textContent = getWelcomeMessage(lang);
                msgArea.appendChild(newWelcomeEl);
            }
        }'''

if target_code in client_js:
    client_js = client_js.replace(target_code, new_code)
    with open(client_js_path, 'w', encoding='utf-8') as f:
        f.write(client_js)
    print("Fixed applyLangToChat.")
else:
    print("Could not find target_code.")
