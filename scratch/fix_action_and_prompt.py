import os

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

# Fix the td flex issue in js/admin.js
for d in directories:
    admin_js_path = os.path.join(d, 'js', 'admin.js')
    if os.path.exists(admin_js_path):
        with open(admin_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the broken td flex layout
        broken_td = '<td class="py-3 px-4 flex gap-2">'
        fixed_td = '<td class="py-3 px-4"><div class="flex gap-2">'
        if broken_td in content:
            content = content.replace(broken_td, fixed_td)
            # also add the closing div before the closing td
            content = content.replace('</button>\n                </td>', '</button>\n                </div></td>')
            
        with open(admin_js_path, 'w', encoding='utf-8') as f:
            f.write(content)

# Fix the AI Prompt in js/admin/ai-chat.js
prompt_addition = """
  IMPORTANT: Náº¿u ngÆ°á»i dÃ¹ng upload áº£nh, há» sáº½ cung cáº¥p má»™t placeholder nhÆ° [áº¢nh Ä‘Ã­nh kÃ¨m: ATTACHED_IMAGE_123]. Báº¡n pháº£i sá» dá»¥ng TRá»°C TIáº¾P chuá»—i placeholder Ä‘Ã³ lÃ m giÃ¡ trá»‹ cho tham sá»‘ imageUrl cá»§a cÃ¡c tool (ví dụ updateHomepageHeroImage). TUYá»†T Äá»I KHÃ”NG yÃªu cáº§u ngÆ°á»i dÃ¹ng pháº£i cung cáº¥p URL URL náº¿u há» Ä‘Ã£ Ä‘Ã­nh kÃ¨m áº£nh!
"""

for d in directories:
    ai_chat_path = os.path.join(d, 'js', 'admin', 'ai-chat.js')
    if os.path.exists(ai_chat_path):
        with open(ai_chat_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # We find the system prompt definition
        target_str = '  You MUST answer in Vietnamese.'
        if target_str in content and 'ATTACHED_IMAGE_' not in content:
            # We already have an ATTACHED_IMAGE resolver logic further down, but we want to add instruction to the prompt
            content = content.replace(target_str, target_str + '\n' + prompt_addition)
            
            with open(ai_chat_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Fixed td layout in admin.js and added image handling instruction to AI prompt in ai-chat.js")
