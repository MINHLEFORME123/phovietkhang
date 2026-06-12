import { db } from "../firebase-config.js";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { normalizeOptions, initApiKeys } from "./utils.js";
import { loadCategories } from "./food-add.js";

const foodTableBody = document.getElementById('food-table-body');
if (!foodTableBody) {
    // Not on food-list page
} else {
    loadFood();

    async function loadFood() {
        window.loadFood = loadFood;
        try {
            const querySnapshot = await getDocs(collection(db, "menu"));
            foodTableBody.innerHTML = '';
            if (querySnapshot.empty) {
                foodTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No food items found.</td></tr>';
                return;
            }
            const items = [];
            querySnapshot.forEach((documentSnapshot) => {
                items.push({ id: documentSnapshot.id, ...documentSnapshot.data() });
            });
            window.__adminFoodItems = items;
            renderFoodRows(items);
        } catch (error) {
            console.error("Error loading menu:", error);
            foodTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Failed to load menu.</td></tr>';
        }
    }

    function renderFoodRows(items) {
        if (!foodTableBody) return;
        foodTableBody.innerHTML = '';
        if (!items.length) {
            foodTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No matching items.</td></tr>';
            return;
        }
        items.forEach((item) => {
            const id = item.id;
            const normalized = normalizeOptions(item.options);
            const optCount = normalized.length > 0 ? `<span class="text-xs bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded-full ml-1">${normalized.length} opt groups</span>` : '';

            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors";
            tr.innerHTML = `
                <td class="py-3 px-4"><img src="${item.image}" class="w-12 h-12 object-cover rounded" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=100'"></td>
                <td class="py-3 px-4">
                    <span class="font-bold text-white">${item.nameVi || ''}</span>
                    ${item.allergenWarning ? '<span class="inline-flex items-center gap-1 bg-red-900/30 text-red-400 text-xs px-2 py-0.5 rounded-md font-semibold border border-red-800/50 ml-2" title="Chá»©a thÃ nh pháº§n dá»… gÃ¢y dá»‹ á»©ng"><span class="material-symbols-outlined text-[14px]">warning</span> Dá»‹ á»©ng</span>' : ''}
                    <br>
                    <span class="text-xs text-secondary">EN: ${item.nameEn || ''}</span><br>
                    <span class="text-xs text-secondary">FI: ${item.nameFi || ''}</span>
                </td>
                <td class="py-3 px-4">
                    <span class="font-bold text-white">VI: ${item.categoryVi || item.category || ''}</span><br>
                    <span class="text-xs text-secondary">EN: ${item.categoryEn || ''}</span><br>
                    <span class="text-xs text-secondary">FI: ${item.categoryFi || ''}</span>
                </td>
                <td class="py-3 px-4">â‚¬${(item.price || 0).toFixed(2)}</td>
                <td class="py-3 px-4">${optCount || '<span class="text-xs text-secondary/50">None</span>'}</td>
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
                tr.querySelector('.btn-edit').addEventListener('click', () => window.openEditModal(id, item));
                tr.querySelector('.btn-delete').addEventListener('click', () => window.deleteFood(id));
            }

            foodTableBody.appendChild(tr);
        });
    }

    function setupAdminFoodSearch() {
        const adminFoodSearch = document.getElementById('admin-food-search');
        if (!adminFoodSearch) return;
        adminFoodSearch.addEventListener('input', () => {
            const q = (adminFoodSearch.value || '').toLowerCase();
            const all = window.__adminFoodItems || [];
            if (!q) { renderFoodRows(all); return; }
            const filtered = all.filter((item) => {
                const text = [item.nameVi, item.nameEn, item.nameFi, item.categoryVi, item.categoryEn, item.categoryFi, item.descVi, item.descEn, item.descFi, (item.tags || []).join(' ')].join(' ').toLowerCase();
                return text.indexOf(q) !== -1;
            });
            renderFoodRows(filtered);
        });
    }

    setupAdminFoodSearch();

    window.deleteFood = async function(id) {
        if (confirm("Are you sure you want to delete this food item?")) {
            try {
                await deleteDoc(doc(db, "menu", id));
                window.showNotification("Food item deleted successfully!", "success");
                loadFood();
                if (document.getElementById('category-datalist')) loadCategories();
            } catch (e) {
                console.error("Delete error:", e);
                window.showNotification("Failed to delete.", "error");
            }
        }
    };

    const btnClearMenu = document.getElementById('btn-clear-menu');
    if (btnClearMenu) {
        btnClearMenu.addEventListener('click', async () => {
            if (confirm('DANGER: Are you sure you want to delete ALL food items? This cannot be undone.')) {
                const pwd = prompt('Type "DELETE" to confirm:');
                if (pwd === "DELETE") {
                    try {
                        btnClearMenu.disabled = true;
                        btnClearMenu.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Clearing...';
                        const querySnapshot = await getDocs(collection(db, "menu"));
                        const deletePromises = [];
                        querySnapshot.forEach((docSnap) => {
                            deletePromises.push(deleteDoc(doc(db, "menu", docSnap.id)));
                        });
                        await Promise.all(deletePromises);
                        window.showNotification(`Successfully deleted ${deletePromises.length} items.`, 'success');
                        loadFood();
                        if (document.getElementById('category-datalist')) loadCategories();
                    } catch (e) {
                        console.error("Error clearing menu:", e);
                        window.showNotification("Failed to clear menu.", 'error');
                    } finally {
                        btnClearMenu.disabled = false;
                        btnClearMenu.innerHTML = '<span class="material-symbols-outlined">delete_sweep</span><span>Clear Menu</span>';
                    }
                } else {
                    window.showNotification("Confirmation failed. Cancelled.", 'error');
                }
            }
        });
    }
}

// â”€â”€â”€ FOOD EDIT MODAL LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const foodTableBody2 = document.getElementById('food-table-body');
if (foodTableBody2) {
    let editOptions = [];
    let editAddingChoices = [];
    let editCompressedImage = '';

    window.openEditModal = async function(id, item) {
        const modal = document.getElementById('edit-modal');
        if (!modal) return;
        await loadCategories();

        document.getElementById('edit-food-id').value = id;
        document.getElementById('edit-name-vi').value = item.nameVi || '';
        document.getElementById('edit-name-en').value = item.nameEn || '';
        document.getElementById('edit-name-fi').value = item.nameFi || '';
        document.getElementById('edit-desc-vi').value = item.descVi || '';
        document.getElementById('edit-desc-en').value = item.descEn || '';
        document.getElementById('edit-desc-fi').value = item.descFi || '';
        document.getElementById('edit-category-vi').value = item.categoryVi || item.category || '';
        document.getElementById('edit-category-en').value = item.categoryEn || '';
        document.getElementById('edit-category-fi').value = item.categoryFi || '';
        document.getElementById('edit-price').value = item.price || 0;

        const editAllergenCb = document.getElementById('edit-allergen');
        if (editAllergenCb) editAllergenCb.checked = item.allergenWarning || false;

        editOptions = item.options ? normalizeOptions(item.options) : [];
        editAddingChoices = [];
        editCompressedImage = '';
        renderEditAddingChoices();
        renderEditOptions();

        modal.classList.remove('hidden');
    };

    window.closeEditModal = function() {
        document.getElementById('edit-modal')?.classList.add('hidden');
    };

    const btnEditAddChoice = document.getElementById('btn-edit-add-choice');
    const editChoicePriceInput = document.getElementById('edit-new-choice-price');
    const editAddedChoicesList = document.getElementById('edit-new-opt-choices');

    function renderEditAddingChoices() {
        if (!editAddedChoicesList) return;
        editAddedChoicesList.innerHTML = '';
        editAddingChoices.forEach((ch, idx) => {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between bg-surface-highlight p-1 rounded text-xs text-white';
            row.innerHTML = `
                <span>${ch.labelVi} / ${ch.labelEn} / ${ch.labelFi} (${ch.price > 0 ? '+' + ch.price.toFixed(2) + 'â‚¬' : 'Free'})</span>
                <button type="button" class="text-red-400 hover:text-red-300 px-1 font-bold" data-idx="${idx}">&times;</button>`;
            row.querySelector('button').addEventListener('click', () => {
                editAddingChoices.splice(idx, 1);
                renderEditAddingChoices();
            });
            editAddedChoicesList.appendChild(row);
        });
    }

    if (btnEditAddChoice) {
        btnEditAddChoice.addEventListener('click', () => {
            const labelVi = document.getElementById('edit-new-choice-label-vi').value.trim();
            const labelEn = document.getElementById('edit-new-choice-label-en').value.trim();
            const labelFi = document.getElementById('edit-new-choice-label-fi').value.trim();
            const priceVal = parseFloat(editChoicePriceInput.value) || 0;
            if (!labelVi && !labelEn && !labelFi) { window.showNotification('Please enter a choice label in at least one language.', 'info'); return; }
            const safeVi = labelVi || labelEn || labelFi;
            const safeEn = labelEn || safeVi;
            const safeFi = labelFi || safeVi;
            editAddingChoices.push({ label: safeEn, labelVi: safeVi, labelEn: safeEn, labelFi: safeFi, price: priceVal });
            document.getElementById('edit-new-choice-label-vi').value = '';
            document.getElementById('edit-new-choice-label-en').value = '';
            document.getElementById('edit-new-choice-label-fi').value = '';
            editChoicePriceInput.value = '';
            renderEditAddingChoices();
        });
    }

    const btnEditAddOpt = document.getElementById('btn-edit-add-option');
    const editOptTypeSelect = document.getElementById('edit-new-opt-type');
    const editOptionsList = document.getElementById('edit-options-list');

    function renderEditOptions() {
        if (!editOptionsList) return;
        editOptionsList.innerHTML = '';
        editOptions.forEach((opt, idx) => {
            const div = document.createElement('div');
            div.className = 'bg-surface-highlight p-2 rounded-lg border border-gray-700/50 space-y-1 relative';
            const choicesHtml = opt.choices.map(c =>
                `<span class="inline-block bg-gray-800 text-secondary text-[10px] px-1.5 py-0.5 rounded mr-1">${c.labelVi || c.label} (${c.price > 0 ? '+' + c.price.toFixed(2) + 'â‚¬' : 'Free'})</span>`
            ).join('');
            const displayTitle = `${opt.nameVi || opt.name} / ${opt.nameEn || opt.name} / ${opt.nameFi || opt.name}`;
            div.innerHTML = `
                <div class="flex justify-between items-center pr-6">
                    <span class="font-bold text-white text-xs">${displayTitle}</span>
                    <span class="text-[9px] px-1 rounded bg-primary/20 text-primary uppercase font-semibold">${opt.type}</span>
                </div>
                <div class="pt-0.5">${choicesHtml}</div>
                <button type="button" class="absolute top-1 right-1 text-red-400 hover:text-red-300 p-0.5" data-idx="${idx}">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>`;
            div.querySelector('button').addEventListener('click', () => { editOptions.splice(idx, 1); renderEditOptions(); });
            editOptionsList.appendChild(div);
        });
    }

    if (btnEditAddOpt) {
        btnEditAddOpt.addEventListener('click', () => {
            const nameVi = document.getElementById('edit-new-opt-name-vi').value.trim();
            const nameEn = document.getElementById('edit-new-opt-name-en').value.trim();
            const nameFi = document.getElementById('edit-new-opt-name-fi').value.trim();
            const type = editOptTypeSelect.value;
            if (!nameVi && !nameEn && !nameFi) { window.showNotification('Please enter an option group name in at least one language.', 'info'); return; }
            if (editAddingChoices.length === 0) { window.showNotification('Please add at least one choice to this option group.', 'info'); return; }
            const safeVi = nameVi || nameEn || nameFi;
            const safeEn = nameEn || safeVi;
            const safeFi = nameFi || safeVi;
            editOptions.push({ name: safeEn, nameVi: safeVi, nameEn: safeEn, nameFi: safeFi, type, choices: [...editAddingChoices] });
            document.getElementById('edit-new-opt-name-vi').value = '';
            document.getElementById('edit-new-opt-name-en').value = '';
            document.getElementById('edit-new-opt-name-fi').value = '';
            editAddingChoices = [];
            renderEditAddingChoices();
            renderEditOptions();
        });
    }

    const editImageInput = document.getElementById('edit-image-file');
    if (editImageInput) {
        editImageInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_W = 500;
                        const scale = MAX_W / img.width;
                        canvas.width = MAX_W;
                        canvas.height = img.height * scale;
                        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                        editCompressedImage = canvas.toDataURL('image/jpeg', 0.7);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }

    const editForm = document.getElementById('edit-food-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-food-id').value;
            const loading = document.getElementById('edit-loading');
            loading?.classList.remove('hidden');
            try {
                const categoryVi = document.getElementById('edit-category-vi').value.trim();
                const categoryEn = document.getElementById('edit-category-en').value.trim();
                const categoryFi = document.getElementById('edit-category-fi').value.trim();
                const updateData = {
                    nameVi: document.getElementById('edit-name-vi').value,
                    nameEn: document.getElementById('edit-name-en').value,
                    nameFi: document.getElementById('edit-name-fi').value,
                    descVi: document.getElementById('edit-desc-vi').value,
                    descEn: document.getElementById('edit-desc-en').value,
                    descFi: document.getElementById('edit-desc-fi').value,
                    category: categoryVi, categoryVi,
                    categoryEn: categoryEn || categoryVi, categoryFi: categoryFi || categoryVi,
                    price: parseFloat(document.getElementById('edit-price').value) || 0,
                    options: [...editOptions],
                    allergenWarning: document.getElementById('edit-allergen')?.checked || false
                };
                if (editCompressedImage) updateData.image = editCompressedImage;
                await updateDoc(doc(db, "menu", id), updateData);
                window.showNotification('Food item updated successfully!', 'success');
                window.closeEditModal();
                if (window.loadFood) window.loadFood();
                if (window.loadCategories) window.loadCategories();
            } catch (err) {
                console.error("Edit error:", err);
                window.showNotification('Failed to update. Check console.', 'error');
            } finally {
                loading?.classList.add('hidden');
            }
        });
    }
}

// â”€â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
initApiKeys();
