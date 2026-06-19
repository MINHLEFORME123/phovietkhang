import { db, getApiKeys } from "../firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export function ensureAdminNotification() {
    if (window.showNotification) return;
    window.showNotification = function(message, type = 'info') {
        let container = document.getElementById('pvk-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pvk-toast-container';
            container.className = 'fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);

            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
                .toast-enter { animation: slideInRight 0.3s ease-out forwards; }
                .toast-exit { animation: slideOutRight 0.3s ease-in forwards; }
            `;
            document.head.appendChild(style);
        }

        const toast = document.createElement('div');
        const colors = type === 'success'
            ? 'bg-green-500/15 border-green-400/30 text-green-50'
            : type === 'error'
                ? 'bg-red-500/15 border-red-400/30 text-red-50'
                : 'bg-surface-highlight border-gray-700 text-white';
        const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

        toast.className = `toast-enter pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[300px] max-w-[400px] transition-all ${colors}`;
        toast.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <div class="flex-1 text-sm leading-tight">${escapeHtml(String(message))}</div>
            <button class="text-current opacity-60 hover:opacity-100 transition-opacity p-1" type="button">
                <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
        `;
        toast.querySelector('button').addEventListener('click', () => toast.remove());
        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.replace('toast-enter', 'toast-exit');
                setTimeout(() => toast.remove(), 300);
            }
        }, 4000);
    };
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

ensureAdminNotification();

// ─── Cloudflare Worker Admin Proxy ────────────────────────────────────────────
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

// ─── API Keys (lazy loaded) ──────────────────────────────────────────────────
export function getApiKeysCached() {
    return apiKeysCache;
}

// ─── Cloudflare Worker Proxy ─────────────────────────────────────────────────
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

// ─── NORMALIZATION UTILITY ───────────────────────────────────────────────────
export function normalizeOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.map(opt => {
        if (typeof opt === 'string') {
            return {
                name: opt, nameVi: opt, nameEn: opt, nameFi: opt, nameSv: opt,
                type: "toggle",
                choices: [{ label: opt, labelVi: opt, labelEn: opt, labelFi: opt, labelSv: opt, price: 0 }]
            };
        }
        const name = opt.name || '';
        const nameVi = opt.nameVi || name;
        const nameEn = opt.nameEn || name;
        const nameFi = opt.nameFi || name;
        const nameSv = opt.nameSv || name;
        const choices = Array.isArray(opt.choices) ? opt.choices.map(c => {
            const label = c.label || '';
            return {
                label, labelVi: c.labelVi || label, labelEn: c.labelEn || label, labelFi: c.labelFi || label, labelSv: c.labelSv || label,
                price: parseFloat(c.price) || 0
            };
        }) : [];
        return { name, nameVi, nameEn, nameFi, nameSv, type: opt.type || 'toggle', choices };
    });
}

// ─── DATE & TIME UTILITIES ───────────────────────────────────────────────────
export function formatOrderDate(dateObj) {
    if (!dateObj) return 'N/A';
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    if (Number.isNaN(d.getTime())) return 'N/A';
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
        return { label: 'Đã hủy', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }
    const created = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : null;
    if (!created || Number.isNaN(created.getTime())) return { label: 'N/A', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    const now = new Date();
    if (status === 'completed') {
        let completedTime = null;
        if (completedAt) completedTime = completedAt instanceof Date ? completedAt : new Date(completedAt);
        if (completedTime) {
            const diffMin = Math.round((completedTime - created) / (60 * 1000));
            return { label: `Hoàn thành trong ${diffMin} phút`, color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
        }
        return { label: 'Đã hoàn thành', color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
    }
    const diffMin = Math.floor((now - created) / (60 * 1000));
    if (diffMin < 1) return { label: 'Vừa xong', color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
    if (diffMin >= 15) return { label: `${diffMin} phút trước`, color: 'red', badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' };
    if (diffMin >= 10) return { label: `${diffMin} phút trước`, color: 'yellow', badgeClass: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
    return { label: `${diffMin} phút trước`, color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
}

// ─── LOYALTY TIER ────────────────────────────────────────────────────────────
export function computeLoyaltyTier(totalSpent) {
    const spent = Number(totalSpent) || 0;
    if (spent >= 500) return { key: 'kim_cuong', labelVi: 'Kim Cương', color: '#7c3aed', icon: 'diamond', discountPercent: 0 };
    if (spent >= 150) return { key: 'bach_kim', labelVi: 'Bạch Kim', color: '#94a3b8', icon: 'military_tech', discountPercent: 0 };
    if (spent >= 85) return { key: 'vang', labelVi: 'Vàng', color: '#eab308', icon: 'workspace_premium', discountPercent: 0 };
    if (spent >= 35) return { key: 'bac', labelVi: 'Bạc', color: '#9ca3af', icon: 'shield', discountPercent: 0 };
    return { key: 'dong', labelVi: 'Đồng', color: '#78350f', icon: 'stars', discountPercent: 0 };
}

// ─── LIST ALL USERS ──────────────────────────────────────────────────────────
export async function listAllUsers() {
    try {
        const qSnap = await getDocs(collection(db, "users"));
        const users = [];
        qSnap.forEach(d => {
            const data = d.data();
            const totalSpent = data.totalSpent || 0;
            users.push({ uid: d.id, email: data.email, name: data.name, role: data.role, totalSpent, loyaltyTier: computeLoyaltyTier(totalSpent).key, createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString()) : null });
        });
        users.sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)));
        return users.slice(0, 30);
    } catch (e) {
        return { error: e.message };
    }
}

// ─── JSON PARSING HELPERS ────────────────────────────────────────────────────
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

// ─── OPENROUTER HELPERS ──────────────────────────────────────────────────────
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

// ─── GLOBAL EXPORT TO EXCEL ──────────────────────────────────────────────────
window.exportTableToExcel = function(tableId, filename = 'export.xlsx') {
    const table = document.getElementById(tableId);
    if (!table) {
        if (window.showNotification) window.showNotification('Không tìm thấy bảng để xuất dữ liệu!', 'error');
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
                        lastCell.textContent.toLowerCase().includes('hành động') ||
                        lastCell.querySelector('button') ||
                        lastCell.innerHTML.trim() === '') {
                        lastCell.remove();
                    }
                }
            });
            const wb = XLSX.utils.table_to_book(clonedTable, { sheet: "Sheet1" });
            XLSX.writeFile(wb, filename);
            if (window.showNotification) window.showNotification('Xuất file Excel thành công!', 'success');
        } catch (error) {
            console.error('Lỗi khi xuất file Excel:', error);
            if (window.showNotification) window.showNotification('Lỗi khi xuất Excel: ' + error.message, 'error');
        }
    };
    if (typeof XLSX === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = proceedExport;
        script.onerror = () => { if (window.showNotification) window.showNotification('Không thể tải thư viện XLSX!', 'error'); };
        document.head.appendChild(script);
    } else {
        proceedExport();
    }
};
