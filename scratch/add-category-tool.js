const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'minhb', 'OneDrive', 'Desktop', 'phovietkhang', 'js', 'admin', 'ai-chat.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update system prompt
content = content.replace(
    '23C(updateMenuCustomFields)',
    '23C(updateMenuCustomFields), 24C(updateMenuCategoryOrder(orderedCategoriesArray))'
);

// 2. Add function definition
const functionToAdd = `
    async function updateMenuCategoryOrder(orderedCategories) {
        try {
            const arr = Array.isArray(orderedCategories) ? orderedCategories : String(orderedCategories).split(',').map(s => s.trim()).filter(Boolean);
            await setDoc(doc(db, "config", "menu"), { categoryOrder: arr }, { merge: true });
            return { success: true, message: \`Đã cập nhật thứ tự danh mục: \${arr.join(', ')}\` };
        } catch (e) { return { error: e.message }; }
    }

    async function listAllFeedbacks() {`;

content = content.replace('    async function listAllFeedbacks() {', functionToAdd);

// 3. Update toolRegistry
content = content.replace(
    `        updateMenuCustomFields:   { fn: updateMenuCustomFields, params: ['dishId', 'customFields'] },`,
    `        updateMenuCustomFields:   { fn: updateMenuCustomFields, params: ['dishId', 'customFields'] },\n        updateMenuCategoryOrder:  { fn: updateMenuCategoryOrder, params: ['orderedCategories'] },`
);

// 4. Update shortCodeMap
content = content.replace(
    `    "23C": "updateMenuCustomFields",`,
    `    "23C": "updateMenuCustomFields",\n    "24C": "updateMenuCategoryOrder",`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched ai-chat.js');
