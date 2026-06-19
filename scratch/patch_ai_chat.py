import os

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

patch_code = """
                        // Auto-resolve dishId if AI passes a name instead of an ID
                        if (resolvedArgs.dishId) {
                            try {
                                const checkSnap = await getDoc(doc(db, "menu", resolvedArgs.dishId));
                                if (!checkSnap.exists()) {
                                    const allDocs = await getDocs(collection(db, "menu"));
                                    const found = allDocs.docs.find(d => {
                                        const data = d.data();
                                        const q = String(resolvedArgs.dishId).trim().toLowerCase();
                                        return (data.nameVi && data.nameVi.toLowerCase() === q) || 
                                               (data.nameEn && data.nameEn.toLowerCase() === q) ||
                                               (data.nameFi && data.nameFi.toLowerCase() === q);
                                    });
                                    if (found) {
                                        resolvedArgs.dishId = found.id;
                                    }
                                }
                            } catch(e) { console.warn("Auto-resolve dishId failed", e); }
                        }
"""

for d in directories:
    ai_chat_path = os.path.join(d, 'js', 'admin', 'ai-chat.js')
    if os.path.exists(ai_chat_path):
        with open(ai_chat_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        target_line = 'if (resolvedArgs.dishes && !resolvedArgs.dishIdArray) resolvedArgs.dishIdArray = resolvedArgs.dishes;'
        
        if target_line in content and 'Auto-resolve dishId' not in content:
            content = content.replace(target_line, target_line + '\n' + patch_code)
            with open(ai_chat_path, 'w', encoding='utf-8') as f:
                f.write(content)

print("Applied Auto-resolve dishId patch to ai-chat.js")
