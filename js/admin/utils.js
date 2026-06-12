import { db, auth, getApiKeys } from "../firebase-config.js";
import { collection, getDocs, getDoc, doc, updateDoc, addDoc, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// â”€â”€â”€ Cloudflare Worker Admin Proxy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';
let WORKER_SECRET = '';

// Initialize API keys cache
let apiKeysCache = null;
export async function initApiKeys() {
    if (apiKeysCache) return apiKeysCache;
    const keys = await getApiKeys();
    apiKeysCache = keys;
    WORKER_SECRET = keys.workerSecret || '';
    return keys;
}

// â”€â”€â”€ API Keys (lazy loaded) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getApiKeysCached() {
    return apiKeysCache;
}

// â”€â”€â”€ Cloudflare Worker Proxy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function callWorker(action, args = {}) {
    const resp = await fetch(CLOUDFLARE_WORKER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': WORKER_SECRET,
        },
        body: JSON.stringify({ action, args }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `Worker error ${resp.status}`);
    return data;
}

// â”€â”€â”€ NORMALIZATION UTILITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function normalizeOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.map(opt => {
        if (typeof opt === 'string') {
            return {
                name: opt, nameVi: opt, nameEn: opt, nameFi: opt,
                type: "toggle",
                choices: [{ label: opt, labelVi: opt, labelEn: opt, labelFi: opt, price: 0 }]
            };
        }
        const name = opt.name || '';
        const nameVi = opt.nameVi || name;
        const nameEn = opt.nameEn || name;
        const nameFi = opt.nameFi || name;
        const choices = Array.isArray(opt.choices) ? opt.choices.map(c => {
            const label = c.label || '';
            return {
                label, labelVi: c.labelVi || label, labelEn: c.labelEn || label, labelFi: c.labelFi || label,
                price: parseFloat(c.price) || 0
            };
        }) : [];
        return { name, nameVi, nameEn, nameFi, type: opt.type || 'toggle', choices };
    });
}

// â”€â”€â”€ DATE & TIME UTILITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function formatOrderDate(dateObj) {
    if (!dateObj) return 'N/A';
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
}

export function getOrderTimeAlert(createdAt, completedAt, status) {
    if (status === 'cancelled') {
        return { label: 'ÄÃ£ há»§y', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }
    const created = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : null;
    if (!created) return { label: 'N/A', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    const now = new Date();
    if (status === 'completed') {
        let completedTime = null;
        if (completedAt) completedTime = completedAt instanceof Date ? completedAt : new Date(completedAt);
        if (completedTime) {
            const diffMin = Math.round((completedTime - created) / (60 * 1000));
            return { label: `HoÃ n táº¥t trong ${diffMin} phÃºt`, color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
        }
        return { label: 'ÄÃ£ hoÃ n táº¥t', color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
    }
    const diffMin = Math.floor((now - created) / (60 * 1000));
    if (diffMin < 1) return { label: 'Vá»«a xong', color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
    if (diffMin >= 15) return { label: `${diffMin} phÃºt trÆ°á»›c`, color: 'red', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' };
    if (diffMin >= 10) return { label: `${diffMin} phÃºt trÆ°á»›c`, color: 'yellow', badgeClass: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
    return { label: `${diffMin} phÃºt trÆ°á»›c`, color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
}

// â”€â”€â”€ LOYALTY TIER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function computeLoyaltyTier(totalSpent) {
    const spent = Number(totalSpent) || 0;
    if (spent >= 40) return { key: 'kim_cuong', labelVi: 'Kim CÆ°Æ¡ng', color: '#7c3aed', icon: 'diamond', discountPercent: 15 };
    if (spent >= 20) return { key: 'kim', labelVi: 'VÃ ng', color: '#eab308', icon: 'workspace_premium', discountPercent: 10 };
    if (spent >= 8) return { key: 'bac', labelVi: 'Báº¡c', color: '#9ca3af', icon: 'shield', discountPercent: 5 };
    if (spent >= 4) return { key: 'vang', labelVi: 'Äá»“ng', color: '#9a3412', icon: 'monetization_on', discountPercent: 0 };
    return { key: 'dong', labelVi: 'Äá»“ng', color: '#78350f', icon: 'stars', discountPercent: 0 };
}

// â”€â”€â”€ LIST ALL USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function listAllUsers() {
    try {
        const qSnap = await getDocs(collection(db, "users"));
        const users = [];
        qSnap.forEach(d => {
            const data = d.data();
            const totalSpent = data.totalSpent || 0;
            users.push({ uid: d.id, email: data.email, name: data.name, role: data.role, totalSpent, loyaltyTier: computeLoyaltyTier(totalSpent).key });
        });
        return users;
    } catch (e) {
        return { error: e.message };
    }
}

// â”€â”€â”€ JSON PARSING HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function stripThinking(str) {
    if (!str) return "";
    return str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export function cleanJsonString(jsonStr) {
    if (!jsonStr) return "";
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    jsonStr = jsonStr.replace(/:\s*\+\s*([0-9]+(?:\.[0-9]+)?)/g, ': $1');
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
    let inString = false, cleanStr = "";
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) inString = !inString;
        if (inString && (char === '\n' || char === '\r')) cleanStr += '\\n';
        else cleanStr += char;
    }
    return cleanStr;
}

export function repairJson(jsonStr) {
    if (!jsonStr) return "[]";
    let str = jsonStr.trim();
    let inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && (i === 0 || str[i - 1] !== '\\')) inString = !inString;
    }
    if (inString) str += '"';
    str = str.trim();
    if (str.endsWith(',')) str = str.substring(0, str.length - 1);
    const stack = [];
    inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && (i === 0 || str[i - 1] !== '\\')) inString = !inString;
        if (!inString) {
            if (char === '{' || char === '[') stack.push(char);
            else if (char === '}') { if (stack[stack.length - 1] === '{') stack.pop(); }
            else if (char === ']') { if (stack[stack.length - 1] === '[') stack.pop(); }
        }
    }
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') str += '}';
        else if (last === '[') str += ']';
    }
    return str;
}

export function extractJsonArray(str) {
    if (!str) return [];
    const noThink = stripThinking(str);
    const start = noThink.indexOf('[');
    const end = noThink.lastIndexOf(']');
    if (start === -1 || end === -1 || end < start) {
        const objStart = noThink.indexOf('{');
        const objEnd = noThink.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
            try {
                const parsedObj = JSON.parse(repairJson(cleanJsonString(noThink.substring(objStart, objEnd + 1))));
                if (parsedObj && Array.isArray(parsedObj.items)) return parsedObj.items;
            } catch (e) { /* fall through */ }
        }
        throw new Error("Could not find a valid JSON array block in AI response.");
    }
    const jsonStr = noThink.substring(start, end + 1);
    const cleaned = cleanJsonString(jsonStr);
    try { return JSON.parse(cleaned); }
    catch (e) {
        console.warn("Initial JSON parse failed, attempting auto-repair...", e);
        try { return JSON.parse(repairJson(cleaned)); }
        catch (repairErr) { console.error("Auto-repair failed:", repairErr); throw e; }
    }
}

export function extractJsonObject(str) {
    if (!str) return {};
    const noThink = stripThinking(str);
    const start = noThink.indexOf('{');
    const end = noThink.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) throw new Error("Could not find a valid JSON object block in AI response.");
    const jsonStr = noThink.substring(start, end + 1);
    const cleaned = cleanJsonString(jsonStr);
    try { return JSON.parse(cleaned); }
    catch (e) {
        console.warn("Initial JSON parse failed, attempting auto-repair...", e);
        try { return JSON.parse(repairJson(cleaned)); }
        catch (repairErr) { console.error("Auto-repair failed:", repairErr); throw e; }
    }
}

// â”€â”€â”€ OPENROUTER HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function callOpenRouterWithFallback(payload, apiKeysOverride = null) {
    const keys = apiKeysOverride || (apiKeysCache ? apiKeysCache.openRouterKeys : []);
    const models = ['nex-agi/nex-n2-pro:free', 'qwen/qwen3-next-80b-a3b-instruct:free'];
    const originalModel = payload.model;
    const modelsToTry = originalModel ? [originalModel, ...models.filter(m => m !== originalModel)] : models;
    const keyArr = Array.isArray(keys) ? keys : [keys];
    for (const model of modelsToTry) {
        for (const key of keyArr) {
            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...payload, model })
                });
                if (!response.ok) { await response.text(); continue; }
                const text = await response.text();
                if (!text) continue;
                const data = JSON.parse(text);
                if (!data || !data.choices || data.choices.length === 0) continue;
                return data;
            } catch (err) { console.warn(`[OpenRouter] ${model} failed: ${err.message}`); }
        }
    }
    throw new Error("All OpenRouter models and API keys failed to respond.");
}

// â”€â”€â”€ GLOBAL EXPORT TO EXCEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.exportTableToExcel = function(tableId, filename = 'export.xlsx') {
    const table = document.getElementById(tableId);
    if (!table) {
        if (window.showNotification) window.showNotification('KhÃ´ng tÃ¬m tháº¥y báº£ng Ä‘á»ƒ xuáº¥t dá»¯ liá»‡u!', 'error');
        return;
    }
    const proceedExport = () => {
        try {
            const clonedTable = table.cloneNode(true);
            const elementsToRemove = clonedTable.querySelectorAll('button, a, select, input, img, .material-symbols-outlined, script, style');
            elementsToRemove.forEach(el => el.remove());
            const rows = clonedTable.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                if (cells.length > 0) {
                    const lastCell = cells[cells.length - 1];
                    if (lastCell.textContent.toLowerCase().includes('action') ||
                        lastCell.textContent.toLowerCase().includes('hÃ nh Ä‘á»™ng') ||
                        lastCell.querySelector('button') ||
                        lastCell.innerHTML.trim() === '') {
                        lastCell.remove();
                    }
                }
            });
            const wb = XLSX.utils.table_to_book(clonedTable, { sheet: "Sheet1" });
            XLSX.writeFile(wb, filename);
            if (window.showNotification) window.showNotification('Xuáº¥t file Excel thÃ nh cÃ´ng!', 'success');
        } catch (error) {
            console.error('Lá»—i khi xuáº¥t file Excel:', error);
            if (window.showNotification) window.showNotification('Lá»—i khi xuáº¥t Excel: ' + error.message, 'error');
        }
    };
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = proceedExport;
        script.onerror = () => { if (window.showNotification) window.showNotification('KhÃ´ng thá»ƒ táº£i thÆ° viá»‡n XLSX!', 'error'); };
        document.head.appendChild(script);
    } else {
        proceedExport();
    }
};
