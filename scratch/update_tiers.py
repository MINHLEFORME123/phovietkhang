import os
import re

JS_FILES = [
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/auth.js',
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin.js',
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/utils.js',
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/ai-chat.js',
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/admin/user-manager.js',
    'c:/Users/minhb/OneDrive/Desktop/phovietkhang/js/profile.js'
]

# 1. Update auth.js
try:
    with open(JS_FILES[0], 'r', encoding='utf-8') as f:
        auth_js = f.read()
    
    auth_js = re.sub(
        r'export function getLoyaltyTier\(totalSpent\)\s*\{[\s\S]*?return\s*\'bronze\';\s*\}',
        '''export function getLoyaltyTier(totalSpent) {
    const s = Number(totalSpent) || 0;
    if (s >= 500) return 'diamond';
    if (s >= 150) return 'platinum';
    if (s >= 85) return 'gold';
    if (s >= 35) return 'silver';
    return 'bronze';
}''', auth_js)
    
    with open(JS_FILES[0], 'w', encoding='utf-8') as f:
        f.write(auth_js)
except FileNotFoundError:
    pass

# 2. Update computeLoyaltyTier in admin.js and utils.js
for path in [JS_FILES[1], JS_FILES[2]]:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = re.sub(
            r'function computeLoyaltyTier\(totalSpent\)\s*\{[\s\S]*?discountPercent:\s*0\s*\};\s*\}',
            '''function computeLoyaltyTier(totalSpent) {
    const spent = Number(totalSpent) || 0;
    if (spent >= 500) return { key: 'kim_cuong', labelVi: 'Kim Cương', color: '#7c3aed', icon: 'diamond', discountPercent: 15 };
    if (spent >= 150) return { key: 'bach_kim', labelVi: 'Bạch Kim', color: '#94a3b8', icon: 'military_tech', discountPercent: 10 };
    if (spent >= 85) return { key: 'vang', labelVi: 'Vàng', color: '#eab308', icon: 'workspace_premium', discountPercent: 5 };
    if (spent >= 35) return { key: 'bac', labelVi: 'Bạc', color: '#9ca3af', icon: 'shield', discountPercent: 2 };
    return { key: 'dong', labelVi: 'Đồng', color: '#78350f', icon: 'stars', discountPercent: 0 };
}''', content)
        
        # Also fix totalSpent display € instead of đ in admin.js
        content = re.sub(r'\$\{totalSpent\.toLocaleString\([^\)]+\)\}\s*(?:đ|Ä\'|d)', r'${totalSpent} €', content)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    except FileNotFoundError:
        pass

# 3. Update updateUserRank in ai-chat.js
try:
    with open(JS_FILES[3], 'r', encoding='utf-8') as f:
        ai_chat = f.read()
    
    # We replace the massive if/else block inside updateUserRank for newSpent assignments
    ai_chat = re.sub(
        r'if \(\[\'kim_cuong\'.*?\]\.includes\(rankClean\)\) \{[\s\S]*?\} else \{',
        '''if (['kim_cuong', 'kim cuong', 'diamond', 'kim cương'].includes(rankClean)) {
                newSpent = 500;
                rankLabel = "Kim Cương";
            } else if (['bach_kim', 'bach kim', 'platinum', 'bạch kim'].includes(rankClean)) {
                newSpent = 150;
                rankLabel = "Bạch Kim";
            } else if (['vang', 'gold', 'vàng'].includes(rankClean)) {
                newSpent = 85;
                rankLabel = "Vàng";
            } else if (['bac', 'silver', 'bạc'].includes(rankClean)) {
                newSpent = 35;
                rankLabel = "Bạc";
            } else if (['dong', 'bronze', 'đồng'].includes(rankClean)) {
                newSpent = 0;
                rankLabel = "Đồng";
            } else {''', ai_chat)
            
    with open(JS_FILES[3], 'w', encoding='utf-8') as f:
        f.write(ai_chat)
except FileNotFoundError:
    pass

# 4. user-manager.js € symbol replace
try:
    with open(JS_FILES[4], 'r', encoding='utf-8') as f:
        um_js = f.read()
    um_js = re.sub(r'\$\{totalSpent\.toLocaleString\([^\)]+\)\}\s*(?:đ|Ä\'|d)', r'${totalSpent} €', um_js)
    with open(JS_FILES[4], 'w', encoding='utf-8') as f:
        f.write(um_js)
except FileNotFoundError:
    pass

print("Update completed.")
