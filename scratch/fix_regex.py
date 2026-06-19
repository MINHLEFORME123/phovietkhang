import os

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

for d in directories:
    ai_chat_path = os.path.join(d, 'js', 'admin', 'ai-chat.js')
    if os.path.exists(ai_chat_path):
        with open(ai_chat_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the regex to include a-zA-Z
        broken_regex = 'str.match(/ATTACHED_IMAGE_[0-9_]+/)'
        fixed_regex = 'str.match(/ATTACHED_IMAGE_[a-zA-Z0-9_]+/)'
        
        if broken_regex in content:
            content = content.replace(broken_regex, fixed_regex)
            with open(ai_chat_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Fixed ATTACHED_IMAGE_ regex in ai-chat.js")
