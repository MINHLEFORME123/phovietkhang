import re

# 1. Modify host/food-list.html
path_html = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang\host\food-list.html'
with open(path_html, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Actions header
content = re.sub(r'<th class=\"py-3 px-4 font-medium\">Actions</th>\s*', '', content)

# Remove Clear Menu button
clear_menu_pattern = r'<button id=\"btn-clear-menu\".*?</button>\s*'
content = re.sub(clear_menu_pattern, '', content, flags=re.DOTALL)

# Remove Edit Food Modal completely
modal_pattern = r'<!-- Edit Food Modal -->.*?</div>\s*</div>\s*(?=<script type=\"module\" src=\"\.\./js/auth\.js\">)'
content = re.sub(modal_pattern, '', content, flags=re.DOTALL)

with open(path_html, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Modify js/admin.js
path_js = r'C:\Users\minhb\OneDrive\Desktop\phovietkhang\js\admin.js'
with open(path_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

replacement = '''                    <td class="py-3 px-4">${optCount || '<span class="text-xs text-secondary/50">None</span>'}</td>
                    ${window.location.pathname.includes('/host/') ? '' : `
                    <td class="py-3 px-4 flex gap-2">
                        <button class="btn-edit text-blue-400 hover:text-blue-300 transition-colors" data-id="${id}">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-delete text-red-400 hover:text-red-300 transition-colors" data-id="${id}">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </td>
                    `}
                `;

                if (!window.location.pathname.includes('/host/')) {
                    // Edit button handler
                    tr.querySelector('.btn-edit').addEventListener('click', () => {
                        window.openEditModal(id, item);
                    });

                    // Delete button handler
                    tr.querySelector('.btn-delete').addEventListener('click', () => {
                        window.deleteFood(id);
                    });
                }'''

search_block = '''                    <td class="py-3 px-4">${optCount || '<span class="text-xs text-secondary/50">None</span>'}</td>
                    <td class="py-3 px-4 flex gap-2">
                        <button class="btn-edit text-blue-400 hover:text-blue-300 transition-colors" data-id="${id}">
                            <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="btn-delete text-red-400 hover:text-red-300 transition-colors" data-id="${id}">
                            <span class="material-symbols-outlined">delete</span>
                        </button>
                    </td>
                `;

                // Edit button handler
                tr.querySelector('.btn-edit').addEventListener('click', () => {
                    window.openEditModal(id, item);
                });

                // Delete button handler
                tr.querySelector('.btn-delete').addEventListener('click', () => {
                    window.deleteFood(id);
                });'''

if search_block in js_content:
    js_content = js_content.replace(search_block, replacement)
    with open(path_js, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print('admin.js updated successfully.')
else:
    print('Could not find the exact block in admin.js to replace.')
