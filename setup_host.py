import os
import shutil
import re

base_dir = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang'
admin_dir = os.path.join(base_dir, 'admin')
host_dir = os.path.join(base_dir, 'host')

# 1. Rename host/index.html to host/reservations.html
old_host_index = os.path.join(host_dir, 'index.html')
new_host_reservations = os.path.join(host_dir, 'reservations.html')
if os.path.exists(old_host_index):
    os.rename(old_host_index, new_host_reservations)

# 2. Copy files from admin to host
files_to_copy = ['index.html', 'order-manager.html', 'food-list.html', 'feedback.html', 'messages.html']
for f in files_to_copy:
    src = os.path.join(admin_dir, f)
    dst = os.path.join(host_dir, f)
    shutil.copy2(src, dst)

# Sidebar structure for Host
host_sidebar = '''<nav class="flex-1 p-4 space-y-2">
            <a href="index.html" id="nav-dashboard" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">dashboard</span>
                <span>Dashboard</span>
            </a>
            <a href="food-list.html" id="nav-food" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">restaurant_menu</span>
                <span>Food Menu</span>
            </a>
            <a href="order-manager.html" id="nav-orders" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">receipt_long</span>
                <span>Orders</span>
            </a>
            <a href="reservations.html" id="nav-reservations" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">table_restaurant</span>
                <span>Reservations</span>
            </a>
            <a href="feedback.html" id="nav-feedback" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">forum</span>
                <span>Feedback</span>
            </a>
            <a href="messages.html" id="nav-messages" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">mail</span>
                <span>Messages</span>
            </a>
            <a href="../kitchen/index.html" class="flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors text-secondary">
                <span class="material-symbols-outlined">soup_kitchen</span>
                <span>Kitchen KDS</span>
            </a>
        </nav>'''

# Helper to mark active link
def set_active(sidebar_html, active_id):
    # Replace the class for the active ID
    pattern = r'(id="' + active_id + r'" class=")[^"]*(")'
    replacement = r'\g<1>flex items-center space-x-3 p-3 rounded-lg hover:bg-surface-highlight transition-colors bg-primary/20 text-primary\g<2>'
    return re.sub(pattern, replacement, sidebar_html)

host_files = ['index.html', 'order-manager.html', 'food-list.html', 'reservations.html', 'feedback.html', 'messages.html']
active_ids = {
    'index.html': 'nav-dashboard',
    'order-manager.html': 'nav-orders',
    'food-list.html': 'nav-food',
    'reservations.html': 'nav-reservations',
    'feedback.html': 'nav-feedback',
    'messages.html': 'nav-messages'
}

for f in host_files:
    fpath = os.path.join(host_dir, f)
    with open(fpath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Replace PHO ADMIN with PHO HOST
    content = content.replace('PHO ADMIN', 'PHO HOST')
    
    # Replace Avatar
    content = re.sub(r'<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold".*?>A</div>', '<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold" id="user-avatar-icon">H</div>', content)
    # Also fix index.html which doesn't have an ID initially
    content = content.replace('<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">A</div>', '<div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold" id="user-avatar-icon">H</div>')

    # Replace sidebar <nav>
    nav_pattern = r'<nav class="flex-1 p-4 space-y-2">.*?</nav>'
    
    active_id = active_ids[f]
    modified_sidebar = set_active(host_sidebar, active_id)
    
    content = re.sub(nav_pattern, modified_sidebar, content, flags=re.DOTALL)
    
    with open(fpath, 'w', encoding='utf-8') as file:
        file.write(content)
    print(f'Processed {f}')
