import os

directories = [
    r'c:\Users\minhb\OneDrive\Desktop\phovietkhang',
    r'c:\Users\minhb\OneDrive\Documents\GitHub\phovietkhang'
]

for d in directories:
    food_manager_path = os.path.join(d, 'js', 'admin', 'food-manager.js')
    if os.path.exists(food_manager_path):
        with open(food_manager_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the broken td flex layout
        broken_td = '<td class="py-3 px-4 flex gap-2">'
        fixed_td = '<td class="py-3 px-4"><div class="flex gap-2">'
        if broken_td in content:
            content = content.replace(broken_td, fixed_td)
            # also add the closing div before the closing td
            content = content.replace('</button>\n                </td>', '</button>\n                </div></td>')
            
        with open(food_manager_path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Fixed flex td layout in food-manager.js")
