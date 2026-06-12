import { db, auth } from "../firebase-config.js";
import { collection, addDoc, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { initApiKeys, getApiKeysCached, callOpenRouterWithFallback, normalizeOptions, extractJsonArray, extractJsonObject, stripThinking } from "./utils.js";

// â”€â”€â”€ DYNAMIC CATEGORY LOADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function loadCategories() {
    const dl = document.getElementById('category-datalist');
    const dlEdit = document.getElementById('edit-category-datalist');
    if (!dl && !dlEdit) return;
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const categories = new Set();
        querySnapshot.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            if (data.category) categories.add(data.category);
        });
        if (dl) {
            dl.innerHTML = '';
            categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat; dl.appendChild(opt); });
        }
        if (dlEdit) {
            dlEdit.innerHTML = '';
            categories.forEach(cat => { const opt = document.createElement('option'); opt.value = cat; dlEdit.appendChild(opt); });
        }
    } catch (e) {
        console.error("Error loading categories: ", e);
    }
}
window.loadCategories = loadCategories;

// â”€â”€â”€ IMAGE PREVIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let currentCompressedImage = "";
const imageInput = document.getElementById('food-image-file');
const imagePreview = document.getElementById('image-preview');
if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    currentCompressedImage = canvas.toDataURL('image/jpeg', 0.7);
                    if (imagePreview) {
                        imagePreview.src = currentCompressedImage;
                        imagePreview.classList.remove('hidden');
                    }
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        } else {
            if (imagePreview) imagePreview.classList.add('hidden');
            currentCompressedImage = "";
        }
    });
}

// â”€â”€â”€ STRUCTURED OPTIONS BUILDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let foodOptions = [];
let currentAddingChoices = [];

const btnAddChoice = document.getElementById('btn-add-choice');
const choicePriceInput = document.getElementById('new-choice-price');
const addedChoicesList = document.getElementById('new-opt-choices');

function renderCurrentAddingChoices() {
    if (!addedChoicesList) return;
    addedChoicesList.innerHTML = '';
    currentAddingChoices.forEach((ch, idx) => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between bg-surface-highlight p-1.5 rounded text-xs text-white';
        row.innerHTML = `<span>${ch.labelVi} / ${ch.labelEn} / ${ch.labelFi} (${ch.price > 0 ? '+' + ch.price.toFixed(2) + 'â‚¬' : 'Free'})</span>
            <button type="button" class="text-red-400 hover:text-red-300 px-1 font-bold text-sm" data-idx="${idx}">&times;</button>`;
        row.querySelector('button').addEventListener('click', () => {
            currentAddingChoices.splice(idx, 1);
            renderCurrentAddingChoices();
        });
        addedChoicesList.appendChild(row);
    });
}

if (btnAddChoice) {
    btnAddChoice.addEventListener('click', () => {
        const labelVi = document.getElementById('new-choice-label-vi').value.trim();
        const labelEn = document.getElementById('new-choice-label-en').value.trim();
        const labelFi = document.getElementById('new-choice-label-fi').value.trim();
        const priceVal = parseFloat(choicePriceInput.value) || 0;
        if (!labelVi && !labelEn && !labelFi) {
            window.showNotification('Please enter a choice label in at least one language.', 'info');
            return;
        }
        const safeVi = labelVi || labelEn || labelFi;
        const safeEn = labelEn || safeVi;
        const safeFi = labelFi || safeVi;
        currentAddingChoices.push({ label: safeEn, labelVi: safeVi, labelEn: safeEn, labelFi: safeFi, price: priceVal });
        document.getElementById('new-choice-label-vi').value = '';
        document.getElementById('new-choice-label-en').value = '';
        document.getElementById('new-choice-label-fi').value = '';
        choicePriceInput.value = '';
        renderCurrentAddingChoices();
    });
}

const btnAddOption = document.getElementById('btn-add-option');
const optTypeSelect = document.getElementById('new-opt-type');
const optionsList = document.getElementById('options-list');

function renderOptions() {
    if (!optionsList) return;
    optionsList.innerHTML = '';
    foodOptions.forEach((opt, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-surface-highlight p-3 rounded-lg border border-gray-700/50 space-y-1.5 relative';
        const choicesHtml = opt.choices.map(c =>
            `<span class="inline-block bg-gray-800 text-secondary text-[11px] px-2 py-0.5 rounded mr-1">${c.labelVi || c.label} (${c.price > 0 ? '+' + c.price.toFixed(2) + 'â‚¬' : 'Free'})</span>`
        ).join('');
        const displayTitle = `${opt.nameVi} / ${opt.nameEn} / ${opt.nameFi}`;
        div.innerHTML = `
            <div class="flex justify-between items-center pr-8">
                <span class="font-bold text-white text-sm">${displayTitle}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary uppercase font-semibold text-[10px]">${opt.type}</span>
            </div>
            <div class="pt-1">${choicesHtml}</div>
            <button type="button" class="absolute top-2 right-2 text-red-400 hover:text-red-300 p-1" data-idx="${idx}">
                <span class="material-symbols-outlined text-base">delete</span>
            </button>`;
        div.querySelector('button').addEventListener('click', () => { foodOptions.splice(idx, 1); renderOptions(); });
        optionsList.appendChild(div);
    });
}

if (btnAddOption) {
    btnAddOption.addEventListener('click', () => {
        const nameVi = document.getElementById('new-opt-name-vi').value.trim();
        const nameEn = document.getElementById('new-opt-name-en').value.trim();
        const nameFi = document.getElementById('new-opt-name-fi').value.trim();
        const type = optTypeSelect.value;
        if (!nameVi && !nameEn && !nameFi) { window.showNotification('Please enter an option group name in at least one language.', 'info'); return; }
        if (currentAddingChoices.length === 0) { window.showNotification('Please add at least one choice to this option group.', 'info'); return; }
        const safeVi = nameVi || nameEn || nameFi;
        const safeEn = nameEn || safeVi;
        const safeFi = nameFi || safeVi;
        foodOptions.push({ name: safeEn, nameVi: safeVi, nameEn: safeEn, nameFi: safeFi, type, choices: [...currentAddingChoices] });
        document.getElementById('new-opt-name-vi').value = '';
        document.getElementById('new-opt-name-en').value = '';
        document.getElementById('new-opt-name-fi').value = '';
        currentAddingChoices = [];
        renderCurrentAddingChoices();
        renderOptions();
    });
}

// â”€â”€â”€ AI MENU IMAGE SCANNER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let menuImageBase64 = "";
const menuImageInput = document.getElementById('menu-image-upload');
if (menuImageInput) {
    menuImageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    menuImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        } else { menuImageBase64 = ""; }
    });
}

const btnAiScan = document.getElementById('btn-ai-scan');
if (btnAiScan) {
    btnAiScan.addEventListener('click', async () => {
        if (!menuImageBase64) { window.showNotification('Please upload a menu image first.', 'info'); return; }
        const loadingIndicator = document.getElementById('ai-scan-loading');
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI is scanning menu image...';
        btnAiScan.disabled = true;
        try {
            const keys = getApiKeysCached();
            const visionPayload = {
                model: 'gpt-oss-120b',
                messages: [{ role: 'user', content: [{ type: "text", text: "Please read all text from this menu image perfectly. List all dishes, prices, descriptions, and any options you see." }, { type: "image_url", image_url: { url: menuImageBase64 } }] }]
            };
            const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.cerebrasPrimary}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(visionPayload)
            });
            if (!visionResponse.ok) throw new Error(`Vision API error: ${await visionResponse.text()}`);
            const visionData = await visionResponse.json();
            if (!visionData || !visionData.choices || visionData.choices.length === 0) throw new Error(visionData?.error?.message || "Invalid response format from Vision AI");
            const extractedText = visionData.choices[0].message.content;

            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI Reasoner is structuring data...';

            const systemPrompt = `You are an expert Vietnamese restaurant menu formatter. Parse the provided raw text extracted from a menu.
For each dish:
1. Translate name/description to Vietnamese, English, Finnish.
2. Auto-generate high-quality Vietnamese description if missing, then translate.
3. Categorize in three languages (e.g. categoryVi: "Phá»Ÿ", categoryEn: "Pho", categoryFi: "Pho"). DO NOT use "MÃ³n chÃ­nh".
4. Infer options:
   - ONLY add PAID options (price > 0) IF they are EXPLICITLY written. Do NOT hallucinate.
   - You CAN and SHOULD auto-generate common FREE exclusion options (price = 0) based on the dish type. For example, for "Phá»Ÿ" or "BÃºn", add multiple "toggle" options like "KhÃ´ng hÃ nh" (No onions), "KhÃ´ng rau mÃ¹i" (No cilantro), "KhÃ´ng mÃ¬ chÃ­nh" (No MSG). For dishes with peanuts, add "KhÃ´ng láº¡c" (No peanuts).
You MUST return ONLY a JSON object with a single key "items" containing the array of dishes. No markdown blocks.
JSON Structure:
{ "items": [ { "nameVi": "TÃªn mÃ³n", "descVi": "MÃ´ táº£ háº¥p dáº«n", "nameEn": "English name", "descEn": "English desc", "nameFi": "Finnish name", "descFi": "Finnish desc", "price": 12.50, "categoryVi": "Phá»Ÿ", "categoryEn": "Pho", "categoryFi": "Pho", "options": [ { "nameVi": "Cáº¥p Ä‘á»™ cay", "nameEn": "Spicy Level", "nameFi": "Tulisuusaste", "type": "single-select", "choices": [ { "labelVi": "KhÃ´ng cay", "labelEn": "Not Spicy", "labelFi": "Ei tulinen", "price": 0 }, { "labelVi": "Cay", "labelEn": "Spicy", "labelFi": "Tulinen", "price": 0 } ] } ] } ] }`;

            const reasonerData = await (async () => {
                try {
                    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${keys.cerebrasPrimary}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'gpt-oss-120b', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Here is the raw text extracted from the menu:\n\n${extractedText}\n\nPlease parse this into the exact JSON format. Return ONLY the JSON object, no markdown.` }] })
                    });
                    if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}`);
                    return await r.json();
                } catch (e) {
                    console.warn('[OpenRouter] Reasoner primary failed:', e);
                    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${keys.cerebrasBackup}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'gpt-oss-120b', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Here is the raw text extracted from the menu:\n\n${extractedText}\n\nPlease parse this into the exact JSON format. Return ONLY the JSON object, no markdown.` }] })
                    });
                    if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}`);
                    return await r.json();
                }
            })();
            const rawJson = reasonerData.choices[0].message.content;
            if (!rawJson) throw new Error("All Reasoner models failed. Please try again later.");
            const items = extractJsonArray(rawJson);
            if (!Array.isArray(items)) throw new Error("AI did not return an array.");

            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> Saving items to Database...';
            let successCount = 0;
            for (const item of items) {
                const catVi = item.categoryVi || item.category || 'Phá»Ÿ';
                await addDoc(collection(db, "menu"), {
                    nameVi: item.nameVi || 'Unknown', descVi: item.descVi || '', nameEn: item.nameEn || '', descEn: item.descEn || '',
                    nameFi: item.nameFi || '', descFi: item.descFi || '', category: catVi, categoryVi: catVi,
                    categoryEn: item.categoryEn || catVi, categoryFi: item.categoryFi || catVi,
                    price: parseFloat(item.price) || 0,
                    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500',
                    options: Array.isArray(item.options) ? item.options : [], createdAt: new Date()
                });
                successCount++;
            }
            window.showNotification(`Menu Scan Complete! Successfully added ${successCount} items from the image.`, 'success');
            loadCategories();
        } catch (error) {
            console.error('AI Menu Scan Error:', error);
            window.showNotification('AI Menu Scan failed. Check console for details.', 'error');
        } finally {
            loadingIndicator.classList.add('hidden');
            btnAiScan.disabled = false;
            menuImageInput.value = '';
            menuImageBase64 = "";
        }
    });
}

// â”€â”€â”€ AI EXCEL BULK IMPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const btnAiExtract = document.getElementById('btn-ai-extract');
if (btnAiExtract) {
    btnAiExtract.addEventListener('click', async () => {
        const fileInput = document.getElementById('excel-upload');
        if (!fileInput.files || fileInput.files.length === 0) { window.showNotification('Please select an Excel or CSV file first.', 'info'); return; }
        const loadingIndicator = document.getElementById('ai-extract-loading');
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI is reading and translating all items...';
        btnAiExtract.disabled = true;
        try {
            const file = fileInput.files[0];
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            const keys = getApiKeysCached();

            const systemPrompt = `You are an expert data parser. Extract ALL food items from the CSV data.
1. Translate missing names/descriptions to VI, EN, FI.
2. Auto-generate appetizing Vietnamese description if missing, then translate.
3. Categorize in three languages (e.g. categoryVi: "Phá»Ÿ", categoryEn: "Pho", categoryFi: "Pho"). DO NOT use "MÃ³n chÃ­nh".
4. Infer options:
   - ONLY add PAID options (price > 0) IF they are EXPLICITLY present in the CSV. Do NOT hallucinate paid options.
   - You CAN and SHOULD auto-generate common FREE exclusion options (price = 0). For example, for "Phá»Ÿ" or "BÃºn", add multiple "toggle" options like "KhÃ´ng hÃ nh" (No onions), "KhÃ´ng rau mÃ¹i" (No cilantro), "KhÃ´ng mÃ¬ chÃ­nh" (No MSG).
You MUST return ONLY a JSON object with a single key "items" containing the array of dishes. No markdown blocks.
JSON Structure: { "items": [ { "nameVi": "TÃªn mÃ³n", "descVi": "MÃ´ táº£ háº¥p dáº«n", "nameEn": "English name", "descEn": "English desc", "nameFi": "Finnish name", "descFi": "Finnish desc", "price": 12.50, "categoryVi": "Phá»Ÿ", "categoryEn": "Pho", "categoryFi": "Pho", "options": [] } ] }`;

            const responseData = await (async () => {
                try {
                    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${keys.cerebrasPrimary}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'gpt-oss-120b', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Raw Data:\n${csvData}\n\nReturn ONLY the JSON object, no markdown.` }] })
                    });
                    if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}`);
                    return await r.json();
                } catch (e) {
                    console.warn('[OpenRouter] Extract primary failed:', e);
                    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${keys.cerebrasBackup}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'gpt-oss-120b', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Raw Data:\n${csvData}\n\nReturn ONLY the JSON object, no markdown.` }] })
                    });
                    if (!r.ok) throw new Error(`OpenRouter HTTP ${r.status}`);
                    return await r.json();
                }
            })();
            const rawJson = responseData.choices[0].message.content;
            if (!rawJson) throw new Error("All Extract models failed. Please try again later.");
            const items = extractJsonArray(rawJson);
            if (!Array.isArray(items)) throw new Error("AI did not return an array.");

            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> Saving items to Database...';
            let successCount = 0;
            for (const item of items) {
                const catVi = item.categoryVi || item.category || 'Phá»Ÿ';
                await addDoc(collection(db, "menu"), {
                    nameVi: item.nameVi || 'Unknown', descVi: item.descVi || '', nameEn: item.nameEn || '', descEn: item.descEn || '',
                    nameFi: item.nameFi || '', descFi: item.descFi || '', category: catVi, categoryVi: catVi,
                    categoryEn: item.categoryEn || catVi, categoryFi: item.categoryFi || catVi,
                    price: parseFloat(item.price) || 0,
                    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500',
                    options: Array.isArray(item.options) ? item.options : [], createdAt: new Date()
                });
                successCount++;
            }
            window.showNotification(`Bulk Import Complete! Successfully added and translated ${successCount} items.`, 'success');
            loadCategories();
        } catch (error) {
            console.error('AI Bulk Extraction Error:', error);
            window.showNotification('AI Extraction failed. Check console for details.', 'error');
        } finally {
            loadingIndicator.classList.add('hidden');
            btnAiExtract.disabled = false;
            fileInput.value = '';
        }
    });
}

// â”€â”€â”€ AUTO TRANSLATE LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const btnTranslate = document.getElementById('btn-translate');
if (btnTranslate) {
    btnTranslate.addEventListener('click', async () => {
        const nameVi = document.getElementById('food-name-vi').value;
        const descVi = document.getElementById('food-desc-vi').value;
        if (!nameVi) { window.showNotification('Please enter at least the Vietnamese Name before translating.', 'info'); return; }
        const loadingIndicator = document.getElementById('ai-loading');
        loadingIndicator.classList.remove('hidden');
        btnTranslate.disabled = true;
        try {
            const keys = getApiKeysCached();
            const payload = {
                messages: [
                    { role: 'system', content: 'You are an expert translator. Translate the given Vietnamese food name and description into English and Finnish. Return ONLY a raw JSON object with these keys: nameEn, descEn, nameFi, descFi. No markdown.' },
                    { role: 'user', content: `Name (VI): ${nameVi}\nDescription (VI): ${descVi || ''}` }
                ]
            };
            const data = await callOpenRouterWithFallback(payload, keys.openRouterKey2);
            const translated = extractJsonObject(data.choices[0].message.content);
            document.getElementById('food-name-en').value = translated.nameEn || '';
            document.getElementById('food-desc-en').value = translated.descEn || '';
            document.getElementById('food-name-fi').value = translated.nameFi || '';
            document.getElementById('food-desc-fi').value = translated.descFi || '';
        } catch (error) {
            console.error('Translation Error:', error);
            window.showNotification('AI Translation failed. Please try again.', 'error');
        } finally {
            loadingIndicator.classList.add('hidden');
            btnTranslate.disabled = false;
        }
    });
}

// â”€â”€â”€ AUTO DESCRIPTION LOGIC â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const btnAutoDesc = document.getElementById('btn-auto-desc');
if (btnAutoDesc) {
    btnAutoDesc.addEventListener('click', async () => {
        const nameVi = document.getElementById('food-name-vi').value;
        if (!nameVi) { window.showNotification('Vui lÃ²ng nháº­p TÃªn mÃ³n (Tiáº¿ng Viá»‡t) trÆ°á»›c!', 'info'); return; }
        const originalText = btnAutoDesc.innerHTML;
        btnAutoDesc.innerHTML = '<span class="material-symbols-outlined animate-spin text-[14px]">sync</span> ...';
        btnAutoDesc.disabled = true;
        try {
            const keys = getApiKeysCached();
            const payload = {
                messages: [
                    { role: 'system', content: 'Báº¡n lÃ  chuyÃªn gia viáº¿t content áº©m thá»±c nhÃ  hÃ ng Viá»‡t Nam cao cáº¥p. Nhiá»‡m vá»¥ cá»§a báº¡n lÃ  viáº¿t má»™t Ä‘oáº¡n mÃ´ táº£ mÃ³n Äƒn (Description) báº±ng Tiáº¿ng Viá»‡t cá»±c ká»³ háº¥p dáº«n, kÃ­ch thÃ­ch vá»‹ giÃ¡c, giá»›i thiá»‡u sÆ¡ vá» nguyÃªn liá»‡u vÃ  cÃ¡ch cháº¿ biáº¿n. Äoáº¡n vÄƒn pháº£i ngáº¯n gá»n, dÃ i tá»‘i Ä‘a 3 cÃ¢u. Chá»‰ tráº£ vá» vÄƒn báº£n, khÃ´ng dÃ¹ng ngoáº·c kÃ©p, khÃ´ng dÃ¹ng markdown.' },
                    { role: 'user', content: `TÃªn mÃ³n Äƒn: ${nameVi}` }
                ]
            };
            const data = await callOpenRouterWithFallback(payload, keys.openRouterKey2);
            document.getElementById('food-desc-vi').value = data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Auto Desc Error:', error);
            window.showNotification('Lá»—i khi táº¡o mÃ´ táº£. Vui lÃ²ng thá»­ láº¡i.', 'error');
        } finally {
            btnAutoDesc.innerHTML = originalText;
            btnAutoDesc.disabled = false;
        }
    });
}

// â”€â”€â”€ FOOD ADD FORM SUBMIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const foodAddForm = document.getElementById('food-add-form');
if (foodAddForm) {
    foodAddForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryVi = document.getElementById('food-category-vi').value;
        const categoryEn = document.getElementById('food-category-en').value;
        const categoryFi = document.getElementById('food-category-fi').value;
        const price = parseFloat(document.getElementById('food-price').value);
        const nameVi = document.getElementById('food-name-vi').value;
        const descVi = document.getElementById('food-desc-vi').value;
        const nameEn = document.getElementById('food-name-en').value;
        const descEn = document.getElementById('food-desc-en').value;
        const nameFi = document.getElementById('food-name-fi').value;
        const descFi = document.getElementById('food-desc-fi').value;

        const loadingIndicator = document.getElementById('ai-loading');
        loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Saving to Database...';
        loadingIndicator.classList.remove('hidden');
        document.getElementById('btn-save-food').disabled = true;

        try {
            let finalImage = currentCompressedImage;
            if (!finalImage) finalImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500';
            const allergenWarning = document.getElementById('food-allergen')?.checked || false;

            await addDoc(collection(db, "menu"), {
                nameVi, descVi, nameEn, descEn, nameFi, descFi,
                category: categoryVi, categoryVi,
                categoryEn: categoryEn || categoryVi, categoryFi: categoryFi || categoryVi,
                price, image: finalImage, options: foodOptions.length > 0 ? [...foodOptions] : [],
                allergenWarning, createdAt: new Date()
            });
            window.showNotification('Food item added successfully!', 'success');
            foodAddForm.reset();
            currentCompressedImage = "";
            foodOptions = [];
            renderOptions();
            if (imagePreview) { imagePreview.classList.add('hidden'); imagePreview.src = ""; }
            loadCategories();
        } catch (error) {
            console.error("Error adding food:", error);
            window.showNotification('Failed to add food. Ensure you have admin rights.', 'error');
        } finally {
            loadingIndicator.classList.add('hidden');
            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Processing... Please wait.';
            document.getElementById('btn-save-food').disabled = false;
        }
    });
}

// â”€â”€â”€ INIT: Load categories on mount & init API keys â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(async () => {
    await initApiKeys();
    if (document.getElementById('category-datalist')) loadCategories();
})();
