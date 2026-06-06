import { db, auth, getApiKeys } from "./firebase-config.js";
import { collection, getDocs, getDoc, doc, updateDoc, addDoc, deleteDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const apiKeys = await getApiKeys();

// ─── Cloudflare Worker Admin Proxy ────────────────────────────────────────────
// After deploying cloudflare-worker/worker.js, paste your worker URL below:
const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev'; // Cloudflare Worker URL
const WORKER_SECRET = apiKeys.workerSecret;

async function callWorker(action, args = {}) {
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

// --- NORMALIZATION UTILITY FOR BACKWARD COMPATIBILITY ---
function normalizeOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.map(opt => {
        if (typeof opt === 'string') {
            return {
                name: opt,
                nameVi: opt,
                nameEn: opt,
                nameFi: opt,
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
                label: label,
                labelVi: c.labelVi || label,
                labelEn: c.labelEn || label,
                labelFi: c.labelFi || label,
                price: parseFloat(c.price) || 0
            };
        }) : [];

        return {
            name,
            nameVi,
            nameEn,
            nameFi,
            type: opt.type || 'toggle',
            choices
        };
    });
}

// --- DATE AND TIME & TIMER UTILITIES ---
function formatOrderDate(dateObj) {
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

function getOrderTimeAlert(createdAt, completedAt, status) {
    if (status === 'cancelled') {
        return { label: 'Đã hủy', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }
    
    const created = createdAt ? (createdAt instanceof Date ? createdAt : new Date(createdAt)) : null;
    if (!created) return { label: 'N/A', color: 'gray', badgeClass: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    
    const now = new Date();
    
    if (status === 'completed') {
        let completedTime = null;
        if (completedAt) {
            completedTime = completedAt instanceof Date ? completedAt : new Date(completedAt);
        }
        
        if (completedTime) {
            const diffMin = Math.round((completedTime - created) / (60 * 1000));
            return { 
                label: `Hoàn tất trong ${diffMin} phút`, 
                color: 'green', 
                badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' 
            };
        }
        return { label: 'Đã hoàn tất', color: 'green', badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' };
    }
    
    // Active orders (pending, cooking, ready)
    const diffMin = Math.floor((now - created) / (60 * 1000));
    if (diffMin < 1) {
        return { 
            label: 'Vừa xong', 
            color: 'green', 
            badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' 
        };
    }
    if (diffMin >= 15) {
        return { 
            label: `${diffMin} phút trước`, 
            color: 'red', 
            badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' 
        };
    }
    if (diffMin >= 10) {
        return { 
            label: `${diffMin} phút trước`, 
            color: 'yellow', 
            badgeClass: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
        };
    }
    return { 
        label: `${diffMin} phút trước`, 
        color: 'green', 
        badgeClass: 'bg-green-500/10 text-green-400 border border-green-500/20' 
    };
}

// --- OPENROUTER & AI API CONFIGURATION ---
const OPENROUTER_API_KEYS = apiKeys.openRouterKeys || [];

// Helper to strip reasoning blocks (<think>...</think>) before parsing
function stripThinking(str) {
    if (!str) return "";
    return str.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// Helper to auto-repair truncated or mildly malformed JSON strings
function repairJson(jsonStr) {
    let str = jsonStr.trim();
    if (!str) return "[]";

    // 1. Close unclosed double quotes if any
    let inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
            inString = !inString;
        }
    }
    if (inString) {
        str += '"';
    }

    // 2. Remove trailing commas
    str = str.trim();
    if (str.endsWith(',')) {
        str = str.substring(0, str.length - 1);
    }

    // 3. Balance braces and brackets using stack tracking
    const stack = [];
    inString = false;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"' && (i === 0 || str[i - 1] !== '\\')) {
            inString = !inString;
        }
        if (!inString) {
            if (char === '{' || char === '[') {
                stack.push(char);
            } else if (char === '}') {
                if (stack[stack.length - 1] === '{') {
                    stack.pop();
                }
            } else if (char === ']') {
                if (stack[stack.length - 1] === '[') {
                    stack.pop();
                }
            }
        }
    }

    // Append missing closures in reverse order
    while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') str += '}';
        else if (last === '[') str += ']';
    }

    return str;
}

// --- ROBUST JSON PARSING HELPERS ---
function cleanJsonString(jsonStr) {
    if (!jsonStr) return "";
    // 1. Remove comments (single line and multi line)
    jsonStr = jsonStr.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    // 2. Remove leading plus sign on numbers (e.g. : +2.50 -> : 2.50)
    jsonStr = jsonStr.replace(/:\s*\+\s*([0-9]+(?:\.[0-9]+)?)/g, ': $1');
    // 3. Remove trailing commas in objects and arrays
    jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
    
    // 4. Escape literal raw newlines inside double-quoted string values
    let inString = false;
    let cleanStr = "";
    for (let i = 0; i < jsonStr.length; i++) {
        const char = jsonStr[i];
        if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
            inString = !inString;
        }
        if (inString && (char === '\n' || char === '\r')) {
            cleanStr += '\\n';
        } else {
            cleanStr += char;
        }
    }
    return cleanStr;
}

function extractJsonArray(str) {
    if (!str) return [];
    const noThink = stripThinking(str);
    
    // Search for array block
    const start = noThink.indexOf('[');
    const end = noThink.lastIndexOf(']');
    
    if (start === -1 || end === -1 || end < start) {
        // Fallback: If it's wrapped in an object like {"items": [...]}, try to parse as object
        const objStart = noThink.indexOf('{');
        const objEnd = noThink.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
            const objStr = noThink.substring(objStart, objEnd + 1);
            try {
                const cleanedObj = cleanJsonString(objStr);
                const repairedObj = repairJson(cleanedObj);
                const parsedObj = JSON.parse(repairedObj);
                if (parsedObj && Array.isArray(parsedObj.items)) {
                    return parsedObj.items;
                }
            } catch (e) {
                // fall through
            }
        }
        throw new Error("Could not find a valid JSON array block in AI response.");
    }
    
    const jsonStr = noThink.substring(start, end + 1);
    const cleaned = cleanJsonString(jsonStr);
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("Initial JSON parse failed, attempting auto-repair...", e);
        try {
            const repaired = repairJson(cleaned);
            return JSON.parse(repaired);
        } catch (repairErr) {
            console.error("Auto-repair failed:", repairErr);
            throw e;
        }
    }
}

function extractJsonObject(str) {
    if (!str) return {};
    const noThink = stripThinking(str);
    const start = noThink.indexOf('{');
    const end = noThink.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) {
        throw new Error("Could not find a valid JSON object block in AI response.");
    }
    const jsonStr = noThink.substring(start, end + 1);
    const cleaned = cleanJsonString(jsonStr);
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("Initial JSON parse failed, attempting auto-repair...", e);
        try {
            const repaired = repairJson(cleaned);
            return JSON.parse(repaired);
        } catch (repairErr) {
            console.error("Auto-repair failed:", repairErr);
            throw e;
        }
    }
}

// Robust fallback model call utility with API Key Rotation
async function callOpenRouterWithFallback(payload, apiKeys = OPENROUTER_API_KEYS) {
    const models = [
        'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
        'meta-llama/llama-3-8b-instruct:free',
        'google/gemma-2-9b-it:free'
    ];
    
    const originalModel = payload.model;
    const modelsToTry = originalModel ? [originalModel, ...models.filter(m => m !== originalModel)] : models;
    
    const keys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    
    for (const model of modelsToTry) {
        for (const key of keys) {
            try {
                console.log(`[OpenRouter] Trying model: ${model} with key: ${key.substring(0, 12)}...`);
                const requestPayload = { ...payload, model: model };
                
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${key}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(requestPayload)
                });
                
                if (!response.ok) {
                    const errText = await response.text();
                    console.warn(`[OpenRouter] ${model} HTTP error (${response.status}) with key ${key.substring(0, 12)}: ${errText}`);
                    continue;
                }
                
                const text = await response.text();
                if (!text) {
                    console.warn(`[OpenRouter] ${model} returned empty response with key ${key.substring(0, 12)}`);
                    continue;
                }
                
                const data = JSON.parse(text);
                if (!data || !data.choices || data.choices.length === 0) {
                    console.warn(`[OpenRouter] ${model} returned no choices with key ${key.substring(0, 12)}:`, JSON.stringify(data?.error || data));
                    continue;
                }
                
                console.log(`[OpenRouter] Success with model: ${model}`);
                return data;
            } catch (err) {
                console.warn(`[OpenRouter] ${model} failed with key ${key.substring(0, 12)}: ${err.message}`);
            }
        }
    }
    throw new Error("All OpenRouter models and API keys failed to respond.");
}



// --- MOBILE UI: SIDEBAR TOGGLE ---
window.toggleAdminSidebar = function() {
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('mobile-sidebar-overlay');
    
    if (sidebar && overlay) {
        if (sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }
};

// --- USER MANAGER LOGIC ---
const userTableBody = document.getElementById('user-table-body');
if (userTableBody) {
    async function loadUsers() {
        window.loadUsers = loadUsers;
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            userTableBody.innerHTML = '';
            
            if (querySnapshot.empty) {
                userTableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-secondary">No users found.</td></tr>';
                return;
            }

            querySnapshot.forEach((documentSnapshot) => {
                const user = documentSnapshot.data();
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors";
                
                tr.innerHTML = `
                    <td class="py-3 px-4">${user.name || 'N/A'}</td>
                    <td class="py-3 px-4">${user.email}</td>
                    <td class="py-3 px-4">
                        <select onchange="window.updateUserRole('${user.uid}', this.value)" class="bg-surface-highlight border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="kitchen" ${user.role === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                            <option value="host" ${user.role === 'host' ? 'selected' : ''}>Host</option>
                        </select>
                    </td>
                    <td class="py-3 px-4 text-secondary text-sm">
                        UID: ${user.uid.substring(0, 8)}...
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading users:", error);
            userTableBody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Failed to load users.</td></tr>';
        }
    }

    // Expose to global so the inline onchange can call it
    window.updateUserRole = async function(uid, newRole) {
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { role: newRole });
            window.showNotification('Role updated successfully!', 'success');
        } catch (error) {
            console.error("Error updating role:", error);
            window.showNotification('Failed to update role. Please ensure you have Admin privileges.', 'error');
        }
    };

    // Load users on mount
    loadUsers();
}

// --- DASHBOARD LOGIC ---
const dashboardContainer = document.getElementById('dashboard-container');
if (dashboardContainer) {
    let revenueChartInstance = null;
    let typeChartInstance = null;

    async function initDashboard() {
        // 1. Total products count
        try {
            const menuSnap = await getDocs(collection(db, "menu"));
            const statProductsEl = document.getElementById('stat-products');
            if (statProductsEl) statProductsEl.textContent = menuSnap.size;
        } catch(e) {
            console.error("Error loading menu stats:", e);
        }

        // 2. Real-time orders listener for revenue, active, completed, charts, and table
        onSnapshot(collection(db, "orders"), (snapshot) => {
            let todayRevenue = 0;
            let activeCount = 0;
            let completedTodayCount = 0;
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Last 7 days helper structure for trend
            const last7Days = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                last7Days[key] = 0;
            }

            // Order types counters
            const typesCount = { 'dine-in': 0, 'takeaway': 0, 'delivery': 0 };

            const allOrders = [];

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const orderId = docSnap.id;
                let orderDate = null;
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    orderDate = data.createdAt.toDate();
                } else if (data.createdAt) {
                    orderDate = new Date(data.createdAt);
                }

                if (!orderDate) return;

                let completedDate = null;
                if (data.completedAt && typeof data.completedAt.toDate === 'function') {
                    completedDate = data.completedAt.toDate();
                } else if (data.completedAt) {
                    completedDate = new Date(data.completedAt);
                }

                allOrders.push({
                    id: orderId,
                    date: orderDate,
                    completedAt: completedDate,
                    customerName: data.customerName || 'Guest',
                    totalPrice: data.totalPrice || 0,
                    status: data.status || 'pending',
                    orderType: data.orderType || 'takeaway',
                    items: data.items || []
                });

                // Stats for TODAY
                if (orderDate >= today) {
                    if (data.status !== 'cancelled') {
                        todayRevenue += data.totalPrice || 0;
                    }
                    if (['pending', 'cooking', 'ready'].includes(data.status)) {
                        activeCount++;
                    }
                    if (data.status === 'completed') {
                        completedTodayCount++;
                    }
                }

                // Stats for last 7 days trend
                const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                if (last7Days.hasOwnProperty(dateKey) && data.status !== 'cancelled') {
                    last7Days[dateKey] += data.totalPrice || 0;
                }

                // Order types distribution
                const t = (data.orderType || 'takeaway').toLowerCase();
                if (typesCount.hasOwnProperty(t)) {
                    typesCount[t]++;
                }
            });

            // Update DOM stats
            const statRevEl = document.getElementById('stat-revenue');
            if (statRevEl) statRevEl.textContent = todayRevenue.toFixed(2) + '€';
            const statActEl = document.getElementById('stat-active');
            if (statActEl) statActEl.textContent = activeCount;
            const statCompEl = document.getElementById('stat-completed');
            if (statCompEl) statCompEl.textContent = completedTodayCount;

            // Sort recent orders (newest first) and display top 5
            allOrders.sort((a, b) => b.date - a.date);
            const recentBody = document.getElementById('recent-orders-table-body');
            if (recentBody) {
                recentBody.innerHTML = '';
                if (allOrders.length === 0) {
                    recentBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No orders found.</td></tr>';
                } else {
                    allOrders.slice(0, 5).forEach(order => {
                        const tr = document.createElement('tr');
                        tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors text-sm text-white";
                        
                        let badgeColor = 'gray';
                        if (order.status === 'pending') badgeColor = 'red';
                        else if (['cooking', 'preparing'].includes(order.status)) badgeColor = 'yellow';
                        else if (order.status === 'ready') badgeColor = 'blue';
                        else if (order.status === 'completed') badgeColor = 'green';

                        const timeAlert = getOrderTimeAlert(order.date, order.completedAt, order.status);
                        const dateString = formatOrderDate(order.date);

                        const itemsText = order.items.map(i => `${i.name} (x${i.qty})`).join(', ');

                        tr.innerHTML = `
                            <td class="py-3 px-4 font-mono text-primary font-medium">#${order.id.substring(0, 5).toUpperCase()}</td>
                            <td class="py-3 px-4">
                                <div class="text-secondary">${dateString}</div>
                                <div class="text-[10px] text-${timeAlert.color}-400 font-semibold mt-0.5">${timeAlert.label}</div>
                            </td>
                            <td class="py-3 px-4">${order.customerName}</td>
                            <td class="py-3 px-4 max-w-[200px] truncate" title="${itemsText}">${itemsText}</td>
                            <td class="py-3 px-4 text-green-400 font-medium">${order.totalPrice.toFixed(2)}€</td>
                            <td class="py-3 px-4">
                                <span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/20">${order.status}</span>
                            </td>
                        `;
                        recentBody.appendChild(tr);
                    });
                }
            }

            // Draw/Update Line Chart: Revenue Trend
            const trendLabels = Object.keys(last7Days);
            const trendData = Object.values(last7Days);
            
            const revChartEl = document.getElementById('revenueChart');
            if (revChartEl) {
                if (revenueChartInstance) {
                    revenueChartInstance.data.labels = trendLabels;
                    revenueChartInstance.data.datasets[0].data = trendData;
                    revenueChartInstance.update();
                } else {
                    const ctx = revChartEl.getContext('2d');
                    revenueChartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: trendLabels,
                            datasets: [{
                                label: 'Revenue (€)',
                                data: trendData,
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                borderWidth: 2,
                                fill: true,
                                tension: 0.3
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false }
                            },
                            scales: {
                                y: { grid: { color: '#1e293b' }, ticks: { color: '#9ca3af' } },
                                x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                            }
                        }
                    });
                }
            }

            // Draw/Update Doughnut Chart: Order Types
            const typeLabels = ['Dine-in', 'Takeaway', 'Delivery'];
            const typeData = [typesCount['dine-in'], typesCount['takeaway'], typesCount['delivery']];

            const typeChartEl = document.getElementById('typeChart');
            if (typeChartEl) {
                if (typeChartInstance) {
                    typeChartInstance.data.datasets[0].data = typeData;
                    typeChartInstance.update();
                } else {
                    const ctx = typeChartEl.getContext('2d');
                    typeChartInstance = new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: typeLabels,
                            datasets: [{
                                data: typeData,
                                backgroundColor: ['#ef4444', '#3b82f6', '#10b981'],
                                borderColor: '#121824',
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: { color: '#9ca3af', boxWidth: 12 }
                                }
                            }
                        }
                    });
                }
            }
        });
    }

    initDashboard();
}

// --- ORDER MANAGER LOGIC ---
const orderManagerContainer = document.getElementById('order-manager-container');
if (orderManagerContainer) {
    let currentFilter = 'all';
    let searchQuery = '';
    let allOrders = [];

    // Modal elements
    const detailModal = document.getElementById('order-detail-modal');
    const modalOrderTitle = document.getElementById('modal-order-title');
    const modalCustName = document.getElementById('modal-cust-name');
    const modalCustPhone = document.getElementById('modal-cust-phone');
    const modalServiceType = document.getElementById('modal-service-type');
    const modalServiceDetail = document.getElementById('modal-service-detail');
    const modalAddressBlock = document.getElementById('modal-address-block');
    const modalAddressText = document.getElementById('modal-address-text');
    const modalOrderItems = document.getElementById('modal-order-items');
    const modalNotesBlock = document.getElementById('modal-notes-block');
    const modalNotesText = document.getElementById('modal-notes-text');
    const modalTotalPrice = document.getElementById('modal-total-price');

    // Tab switcher
    window.setFilter = function(filter) {
        currentFilter = filter;
        
        // Update active tab styles
        document.querySelectorAll('.status-tab-btn').forEach(btn => {
            if (btn.getAttribute('onclick').includes(filter)) {
                btn.className = "status-tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-primary/20 text-primary text-white";
            } else {
                btn.className = "status-tab-btn px-4 py-1.5 rounded-md text-sm font-medium text-secondary hover:text-white transition-all";
            }
        });

        renderOrders();
    };

    // View Details
    window.viewOrderDetails = function(orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        modalOrderTitle.textContent = `Order Details #${order.id.substring(0, 8).toUpperCase()}`;
        modalCustName.textContent = order.customerName || 'N/A';
        modalCustPhone.textContent = order.customerPhone || 'N/A';
        modalServiceType.textContent = order.orderType === 'dine-in' ? 'Dine-In' : order.orderType === 'takeaway' ? 'Takeaway' : 'Delivery';
        modalServiceDetail.textContent = order.orderType === 'dine-in' ? `Table: ${order.tableNumber || 'N/A'}` : 'N/A';
        
        if (order.orderType === 'takeaway' && order.address) {
            modalAddressBlock.classList.remove('hidden');
            modalAddressText.textContent = order.address;
        } else {
            modalAddressBlock.classList.add('hidden');
        }

        // Render products
        modalOrderItems.innerHTML = '';
        order.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800/30 text-white text-xs";
            
            // Options text
            let optsText = '';
            if (item.selectedOptions && item.selectedOptions.length > 0) {
                optsText = `<div class="text-[10px] text-secondary mt-0.5">Options: ${item.selectedOptions.map(o => o.choiceLabel || o.label).join(', ')}</div>`;
            }

            tr.innerHTML = `
                <td class="py-2 px-3">
                    <div class="font-semibold">${item.name}</div>
                    ${optsText}
                </td>
                <td class="py-2 px-3 text-center">${item.qty}</td>
                <td class="py-2 px-3 text-right font-medium">${(item.price * item.qty).toFixed(2)}€</td>
            `;
            modalOrderItems.appendChild(tr);
        });

        if (order.notes) {
            modalNotesBlock.classList.remove('hidden');
            modalNotesText.textContent = order.notes;
        } else {
            modalNotesBlock.classList.add('hidden');
        }

        modalTotalPrice.textContent = order.totalPrice.toFixed(2) + '€';
        
        detailModal.classList.remove('hidden');
    };

    window.closeOrderModal = function() {
        detailModal.classList.add('hidden');
    };

    // Update status from selector
    window.changeStatus = async function(orderId, newStatus) {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'completed') {
                updateData.completedAt = new Date();
            }
            await updateDoc(doc(db, "orders", orderId), updateData);

            // Send notification email when status is set to ready
            if (newStatus === 'ready') {
                const order = allOrders.find(o => o.id === orderId);
                if (order && order.customerEmail) {
                    const orderLang = order.language || 'en';
                    const readyTranslations = {
                        vi: {
                            subject: `[Phở Việt Khang] Đơn hàng của bạn đã sẵn sàng! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "ĐƠN HÀNG ĐÃ SẴN SÀNG",
                            intro: `Xin chào <strong>${order.customerName || 'Quý khách'}</strong>,<br><br>Tin vui! Đơn hàng của bạn tại Phở Việt Khang đã được chế biến xong và sẵn sàng phục vụ.`,
                            summaryHeader: "Chi tiết đơn hàng:",
                            totalLabel: "Tổng cộng",
                            serviceType: "Hình thức",
                            orderId: "Mã đơn hàng",
                            footer: "Cảm ơn quý khách đã ủng hộ nhà hàng. Phở Việt Khang © 2026."
                        },
                        en: {
                            subject: `[Phở Việt Khang] Your Order is Ready! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "YOUR ORDER IS READY",
                            intro: `Hi <strong>${order.customerName || 'Customer'}</strong>,<br><br>Great news! Your order at Phở Việt Khang is ready and waiting for you.`,
                            summaryHeader: "Here is a summary of your order:",
                            totalLabel: "Total Price",
                            serviceType: "Service Type",
                            orderId: "Order ID",
                            footer: "Thank you for dining with us! Phở Việt Khang © 2026."
                        },
                        fi: {
                            subject: `[Phở Việt Khang] Tilauksesi on valmis! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "TILAUKSESI ON VALMIS",
                            intro: `Hei <strong>${order.customerName || 'Asiakas'}</strong>,<br><br>Hienoja uutisia! Tilauksesi Phở Việt Khangissa on valmis ja odottaa sinua.`,
                            summaryHeader: "Tässä on yhteenveto tilauksestasi:",
                            totalLabel: "Yhteensä",
                            serviceType: "Palvelutyyppi",
                            orderId: "Tilaustunnus",
                            footer: "Kiitos asioinnistasi kanssamme! Phở Việt Khang © 2026."
                        }
                    };

                    const rData = readyTranslations[orderLang] || readyTranslations['en'];
                    const itemsHtml = (order.items || []).map(i => `
                        <li style="margin-bottom: 5px;"><strong>${i.qty}x</strong> ${i.name}</li>
                    `).join('');

                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">${rData.title}</h2>
                            <p>${rData.intro}</p>
                            
                            <p><strong>${rData.summaryHeader}</strong></p>
                            <ul style="padding-left: 20px; margin: 15px 0;">
                                ${itemsHtml}
                            </ul>
                            
                            <p style="font-size: 1.1em;"><strong>${rData.totalLabel}:</strong> <span style="color: #10b981; font-weight: bold;">${(order.totalPrice || 0).toFixed(2)}€</span></p>
                            
                            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; border: 1px solid #e9ecef;">
                                <p style="margin: 0; font-size: 0.9em; color: #555;"><strong>${rData.serviceType}:</strong> ${order.orderType === 'dine-in' ? `Dine-in (Table ${order.tableNumber || 'N/A'})` : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}</p>
                                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${rData.orderId}:</strong> #${orderId.toUpperCase()}</p>
                            </div>
                            
                            <p style="margin-top: 25px;">${rData.footer}</p>
                        </div>
                    `;

                    await callWorker('sendEmail', {
                        to: order.customerEmail,
                        subject: rData.subject,
                        html: emailHtml
                    });
                }
            }
        } catch(e) {
            console.error("Error updating order status:", e);
            window.showNotification("Failed to update status. Please try again.", 'error');
        }
    };

    // Delete order
    window.deleteOrder = async function(orderId) {
        if (!confirm("Are you sure you want to permanently delete this order?")) return;
        try {
            await deleteDoc(doc(db, "orders", orderId));
        } catch(e) {
            console.error("Error deleting order:", e);
            window.showNotification("Failed to delete order.", 'error');
        }
    };

    function renderOrders() {
        const tableBody = document.getElementById('orders-table-body');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        // Filter and Search
        const filtered = allOrders.filter(order => {
            const matchesStatus = currentFilter === 'all' || order.status === currentFilter;
            const matchesSearch = order.id.toLowerCase().includes(searchQuery) ||
                                  (order.customerName || '').toLowerCase().includes(searchQuery) ||
                                  (order.customerPhone || '').toLowerCase().includes(searchQuery);
            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-secondary">No orders found.</td></tr>';
            return;
        }

        filtered.forEach(order => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors text-sm text-white";

            let badgeColor = 'gray';
            if (order.status === 'pending') badgeColor = 'red';
            else if (['cooking', 'preparing'].includes(order.status)) badgeColor = 'yellow';
            else if (order.status === 'ready') badgeColor = 'blue';
            else if (order.status === 'completed') badgeColor = 'green';

            const timeAlert = getOrderTimeAlert(order.createdAt, order.completedAt, order.status);
            const dateString = formatOrderDate(order.createdAt);

            tr.innerHTML = `
                <td class="py-3.5 px-4 font-mono text-primary font-medium">#${order.id.substring(0, 8).toUpperCase()}</td>
                <td class="py-3.5 px-4">
                    <div class="text-secondary">${dateString}</div>
                    <div class="text-[10px] text-${timeAlert.color}-400 font-semibold mt-0.5">${timeAlert.label}</div>
                </td>
                <td class="py-3.5 px-4">
                    <div class="font-semibold">${order.customerName || 'Guest'}</div>
                    <div class="text-xs text-secondary mt-0.5">${order.customerPhone || 'N/A'}</div>
                </td>
                <td class="py-3.5 px-4">
                    <span class="capitalize font-medium">${order.orderType === 'dine-in' ? `Dine-In (Table ${order.tableNumber || 'N/A'})` : order.orderType}</span>
                </td>
                <td class="py-3.5 px-4 text-green-400 font-semibold">${order.totalPrice.toFixed(2)}€</td>
                <td class="py-3.5 px-4">
                    ${order.emailConfirmed === false ? 
                        `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Chờ email</span>` : 
                        `<span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/20">${order.status}</span>`
                    }
                </td>
                <td class="py-3.5 px-4">
                    <div class="flex items-center gap-2">
                        <select onchange="window.changeStatus('${order.id}', this.value)" class="bg-surface-highlight border border-gray-700 text-white text-xs rounded-lg focus:ring-primary focus:border-primary p-1.5 pr-8">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="cooking" ${order.status === 'cooking' ? 'selected' : ''}>Cooking</option>
                            <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        <button onclick="window.viewOrderDetails('${order.id}')" class="p-1.5 hover:bg-surface-highlight text-primary hover:text-blue-400 rounded transition-colors" title="View details">
                            <span class="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button onclick="window.deleteOrder('${order.id}')" class="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-colors" title="Delete permanently">
                            <span class="material-symbols-outlined text-lg">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Input Search Listener
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderOrders();
        });
    }

    // Real-time listener
    onSnapshot(collection(db, "orders"), (snapshot) => {
        allOrders = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            let date = null;
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                date = data.createdAt.toDate();
            } else if (data.createdAt) {
                date = new Date(data.createdAt);
            }
            
            allOrders.push({
                ...data,
                id: docSnap.id,
                createdAt: date
            });
        });

        // Sort newest first
        allOrders.sort((a, b) => b.createdAt - a.createdAt);

        renderOrders();
    });
}

// --- DYNAMIC CATEGORY LOADER ---
async function loadCategories() {
    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        const categories = new Set();
        querySnapshot.forEach((documentSnapshot) => {
            const data = documentSnapshot.data();
            if (data.category) {
                categories.add(data.category);
            }
        });
        
        // Populate category-datalist (add page)
        const dl = document.getElementById('category-datalist');
        if (dl) {
            dl.innerHTML = '';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                dl.appendChild(opt);
            });
        }
        
        // Populate edit-category-datalist (list page modal)
        const dlEdit = document.getElementById('edit-category-datalist');
        if (dlEdit) {
            dlEdit.innerHTML = '';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                dlEdit.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error loading categories: ", e);
    }
}
loadCategories();

// --- IMAGE PREVIEW & COMPRESSION (Base64) ---
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

// --- STRUCTURED OPTIONS BUILDER (ADD PAGE) ---
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
        row.innerHTML = `
            <span>${ch.labelVi} / ${ch.labelEn} / ${ch.labelFi} (${ch.price > 0 ? '+' + ch.price.toFixed(2) + '€' : 'Free'})</span>
            <button type="button" class="text-red-400 hover:text-red-300 px-1 font-bold text-sm" data-idx="${idx}">&times;</button>
        `;
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
        
        currentAddingChoices.push({
            label: safeEn,
            labelVi: safeVi,
            labelEn: safeEn,
            labelFi: safeFi,
            price: priceVal
        });
        
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
            `<span class="inline-block bg-gray-800 text-secondary text-[11px] px-2 py-0.5 rounded mr-1">
                ${c.labelVi || c.label} (${c.price > 0 ? '+' + c.price.toFixed(2) + '€' : 'Free'})
             </span>`
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
            </button>
        `;
        div.querySelector('button').addEventListener('click', () => {
            foodOptions.splice(idx, 1);
            renderOptions();
        });
        optionsList.appendChild(div);
    });
}

if (btnAddOption) {
    btnAddOption.addEventListener('click', () => {
        const nameVi = document.getElementById('new-opt-name-vi').value.trim();
        const nameEn = document.getElementById('new-opt-name-en').value.trim();
        const nameFi = document.getElementById('new-opt-name-fi').value.trim();
        const type = optTypeSelect.value;
        
        if (!nameVi && !nameEn && !nameFi) {
            window.showNotification('Please enter an option group name in at least one language.', 'info');
            return;
        }
        if (currentAddingChoices.length === 0) {
            window.showNotification('Please add at least one choice to this option group.', 'info');
            return;
        }
        
        const safeVi = nameVi || nameEn || nameFi;
        const safeEn = nameEn || safeVi;
        const safeFi = nameFi || safeVi;
        
        foodOptions.push({
            name: safeEn,
            nameVi: safeVi,
            nameEn: safeEn,
            nameFi: safeFi,
            type,
            choices: [...currentAddingChoices]
        });
        
        document.getElementById('new-opt-name-vi').value = '';
        document.getElementById('new-opt-name-en').value = '';
        document.getElementById('new-opt-name-fi').value = '';
        currentAddingChoices = [];
        renderCurrentAddingChoices();
        renderOptions();
    });
}

// --- AI MENU IMAGE SCANNER ---
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
        } else {
            menuImageBase64 = "";
        }
    });
}

const btnAiScan = document.getElementById('btn-ai-scan');
if (btnAiScan) {
    btnAiScan.addEventListener('click', async () => {
        if (!menuImageBase64) {
            window.showNotification('Please upload a menu image first.', 'info');
            return;
        }

        const loadingIndicator = document.getElementById('ai-scan-loading');
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI is scanning menu image...';
        btnAiScan.disabled = true;

        try {
            const apiKey = apiKeys.openRouterKey1;
            
            // Step 1: Vision Extraction
            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI Vision is reading image...';
            
            const visionPayload = {
                model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: "text", text: "Please read all text from this menu image perfectly. List all dishes, prices, descriptions, and any options you see." },
                            { type: "image_url", image_url: { url: menuImageBase64 } }
                        ]
                    }
                ]
            };

            const visionResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(visionPayload)
            });
            
            if (!visionResponse.ok) throw new Error(`Vision API error: ${await visionResponse.text()}`);
            const visionData = await visionResponse.json();
            if (!visionData || !visionData.choices || visionData.choices.length === 0) {
                console.error("Vision Data:", visionData);
                throw new Error(visionData?.error?.message || "Invalid response format from Vision AI");
            }
            const extractedText = visionData.choices[0].message.content;

            // Step 2: Reasoning and JSON Structuring
            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> AI Reasoner is structuring data...';

            const systemPrompt = `You are an expert Vietnamese restaurant menu formatter. Parse the provided raw text extracted from a menu.
            For each dish:
            1. Translate name/description to Vietnamese, English, Finnish.
            2. Auto-generate high-quality Vietnamese description if missing, then translate.
            3. Categorize in three languages (e.g. categoryVi: "Phở", categoryEn: "Pho", categoryFi: "Pho"). DO NOT use "Món chính".
            4. Infer options:
               - ONLY add PAID options (price > 0) IF they are EXPLICITLY written. Do NOT hallucinate.
               - You CAN and SHOULD auto-generate common FREE exclusion options (price = 0) based on the dish type. For example, for "Phở" or "Bún", add multiple "toggle" options like "Không hành" (No onions), "Không rau mùi" (No cilantro), "Không mì chính" (No MSG). For dishes with peanuts, add "Không lạc" (No peanuts).
            
            You MUST return ONLY a JSON object with a single key "items" containing the array of dishes. No markdown blocks.
            JSON Structure:
            {
              "items": [
                {
                  "nameVi": "Tên món",
                  "descVi": "Mô tả hấp dẫn",
                  "nameEn": "English name",
                  "descEn": "English desc",
                  "nameFi": "Finnish name",
                  "descFi": "Finnish desc",
                  "price": 12.50,
                  "categoryVi": "Phở",
                  "categoryEn": "Pho",
                  "categoryFi": "Pho",
                  "options": [
                    {
                      "nameVi": "Cấp độ cay",
                      "nameEn": "Spicy Level",
                      "nameFi": "Tulisuusaste",
                      "type": "single-select",
                      "choices": [
                        { "labelVi": "Không cay", "labelEn": "Not Spicy", "labelFi": "Ei tulinen", "price": 0 },
                        { "labelVi": "Cay", "labelEn": "Spicy", "labelFi": "Tulinen", "price": 0 }
                      ]
                    }
                  ]
                }
              ]
            }`;

            const reasonerPayload = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Here is the raw text extracted from the menu:\n\n${extractedText}\n\nPlease parse this into the exact JSON format. Return ONLY the JSON object, no markdown.` }
                ]
            };

            const reasonerData = await callOpenRouterWithFallback(reasonerPayload, apiKey);
            const rawJson = reasonerData.choices[0].message.content;

            if (!rawJson) {
                throw new Error("All Reasoner models failed. Please try again later.");
            }
            const items = extractJsonArray(rawJson);
            if (!Array.isArray(items)) {
                throw new Error("AI did not return an array.");
            }

            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> Saving items to Database...';

            let successCount = 0;
            for (const item of items) {
                const catVi = item.categoryVi || item.category || 'Phở';
                await addDoc(collection(db, "menu"), {
                    nameVi: item.nameVi || 'Unknown',
                    descVi: item.descVi || '',
                    nameEn: item.nameEn || '',
                    descEn: item.descEn || '',
                    nameFi: item.nameFi || '',
                    descFi: item.descFi || '',
                    category: catVi,
                    categoryVi: catVi,
                    categoryEn: item.categoryEn || catVi,
                    categoryFi: item.categoryFi || catVi,
                    price: parseFloat(item.price) || 0,
                    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500', 
                    options: Array.isArray(item.options) ? item.options : [],
                    createdAt: new Date()
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

// --- AI EXCEL BULK IMPORT ---
const btnAiExtract = document.getElementById('btn-ai-extract');
if (btnAiExtract) {
    btnAiExtract.addEventListener('click', async () => {
        const fileInput = document.getElementById('excel-upload');
        if (!fileInput.files || fileInput.files.length === 0) {
            window.showNotification('Please select an Excel or CSV file first.', 'info');
            return;
        }

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
            
            const apiKey = apiKeys.openRouterKey1;

            const systemPrompt = `You are an expert data parser. Extract ALL food items from the CSV data.
            1. Translate missing names/descriptions to VI, EN, FI.
            2. Auto-generate appetizing Vietnamese description if missing, then translate.
            3. Categorize in three languages (e.g. categoryVi: "Phở", categoryEn: "Pho", categoryFi: "Pho"). DO NOT use "Món chính".
            4. Infer options:
               - ONLY add PAID options (price > 0) IF they are EXPLICITLY present in the CSV. Do NOT hallucinate paid options.
               - You CAN and SHOULD auto-generate common FREE exclusion options (price = 0). For example, for "Phở" or "Bún", add multiple "toggle" options like "Không hành" (No onions), "Không rau mùi" (No cilantro), "Không mì chính" (No MSG).
            
            You MUST return ONLY a JSON object with a single key "items" containing the array of dishes. No markdown blocks.
            JSON Structure:
            {
              "items": [
                {
                  "nameVi": "Tên món",
                  "descVi": "Mô tả hấp dẫn",
                  "nameEn": "English name",
                  "descEn": "English desc",
                  "nameFi": "Finnish name",
                  "descFi": "Finnish desc",
                  "price": 12.50,
                  "categoryVi": "Phở",
                  "categoryEn": "Pho",
                  "categoryFi": "Pho",
                  "options": [
                    {
                      "nameVi": "Cấp độ cay",
                      "nameEn": "Spicy Level",
                      "nameFi": "Tulisuusaste",
                      "type": "single-select",
                      "choices": [
                        { "labelVi": "Không cay", "labelEn": "Not Spicy", "labelFi": "Ei tulinen", "price": 0 },
                        { "labelVi": "Cay", "labelEn": "Spicy", "labelFi": "Tulinen", "price": 0 }
                      ]
                    }
                  ]
                }
              ]
            }`;

            const payload = {
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Raw Data:\n${csvData}\n\nReturn ONLY the JSON object, no markdown.` }
                ]
            };

            const responseData = await callOpenRouterWithFallback(payload, apiKey);
            const rawJson = responseData.choices[0].message.content;

            if (!rawJson) {
                throw new Error("All Extract models failed. Please try again later.");
            }
            let rawJsonFinal = rawJson;
            const items = extractJsonArray(rawJson);
            
            if (!Array.isArray(items)) {
                throw new Error("AI did not return an array.");
            }

            loadingIndicator.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-1 text-sm">sync</span> Saving items to Database...';

            let successCount = 0;
            for (const item of items) {
                const catVi = item.categoryVi || item.category || 'Phở';
                await addDoc(collection(db, "menu"), {
                    nameVi: item.nameVi || 'Unknown',
                    descVi: item.descVi || '',
                    nameEn: item.nameEn || '',
                    descEn: item.descEn || '',
                    nameFi: item.nameFi || '',
                    descFi: item.descFi || '',
                    category: catVi,
                    categoryVi: catVi,
                    categoryEn: item.categoryEn || catVi,
                    categoryFi: item.categoryFi || catVi,
                    price: parseFloat(item.price) || 0,
                    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500', 
                    options: Array.isArray(item.options) ? item.options : [],
                    createdAt: new Date()
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

// --- AUTO TRANSLATE LOGIC ---
const btnTranslate = document.getElementById('btn-translate');
if (btnTranslate) {
    btnTranslate.addEventListener('click', async () => {
        const nameVi = document.getElementById('food-name-vi').value;
        const descVi = document.getElementById('food-desc-vi').value;
        
        if (!nameVi) {
            window.showNotification('Please enter at least the Vietnamese Name before translating.', 'info');
            return;
        }

        const loadingIndicator = document.getElementById('ai-loading');
        loadingIndicator.classList.remove('hidden');
        btnTranslate.disabled = true;

        try {
            const apiKey = apiKeys.openRouterKey2;
            const payload = {
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert translator. Translate the given Vietnamese food name and description into English and Finnish. Return ONLY a raw JSON object with these keys: nameEn, descEn, nameFi, descFi. No markdown.'
                    },
                    {
                        role: 'user',
                        content: `Name (VI): ${nameVi}\nDescription (VI): ${descVi || ''}`
                    }
                ]
            };

            const data = await callOpenRouterWithFallback(payload, apiKey);
            let rawJson = data.choices[0].message.content;
            const translated = extractJsonObject(rawJson);

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

// --- AUTO DESCRIPTION LOGIC ---
const btnAutoDesc = document.getElementById('btn-auto-desc');
if (btnAutoDesc) {
    btnAutoDesc.addEventListener('click', async () => {
        const nameVi = document.getElementById('food-name-vi').value;
        if (!nameVi) {
            window.showNotification('Vui lòng nhập Tên món (Tiếng Việt) trước!', 'info');
            return;
        }

        const originalText = btnAutoDesc.innerHTML;
        btnAutoDesc.innerHTML = '<span class="material-symbols-outlined animate-spin text-[14px]">sync</span> ...';
        btnAutoDesc.disabled = true;

        try {
            const apiKey = apiKeys.openRouterKey2;
            const payload = {
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là chuyên gia viết content ẩm thực nhà hàng Việt Nam cao cấp. Nhiệm vụ của bạn là viết một đoạn mô tả món ăn (Description) bằng Tiếng Việt cực kỳ hấp dẫn, kích thích vị giác, giới thiệu sơ về nguyên liệu và cách chế biến. Đoạn văn phải ngắn gọn, dài tối đa 3 câu. Chỉ trả về văn bản, không dùng ngoặc kép, không dùng markdown.'
                    },
                    {
                        role: 'user',
                        content: `Tên món ăn: ${nameVi}`
                    }
                ]
            };

            const data = await callOpenRouterWithFallback(payload, apiKey);
            const desc = data.choices[0].message.content.trim();
            document.getElementById('food-desc-vi').value = desc;

        } catch (error) {
            console.error('Auto Desc Error:', error);
            window.showNotification('Lỗi khi tạo mô tả. Vui lòng thử lại.', 'error');
        } finally {
            btnAutoDesc.innerHTML = originalText;
            btnAutoDesc.disabled = false;
        }
    });
}

// --- SUBMIT SINGLE ITEM LOGIC ---
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
            if (!finalImage) {
                finalImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500';
            }

            await addDoc(collection(db, "menu"), {
                nameVi, descVi, nameEn, descEn, nameFi, descFi, 
                category: categoryVi,
                categoryVi,
                categoryEn: categoryEn || categoryVi,
                categoryFi: categoryFi || categoryVi,
                price, 
                image: finalImage,
                options: foodOptions.length > 0 ? [...foodOptions] : [],
                createdAt: new Date()
            });
            
            window.showNotification('Food item added successfully!', 'success');
            foodAddForm.reset();
            currentCompressedImage = "";
            foodOptions = [];
            renderOptions();
            if (imagePreview) {
                imagePreview.classList.add('hidden');
                imagePreview.src = "";
            }
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

// --- FOOD LIST & EDIT LOGIC ---
const foodTableBody = document.getElementById('food-table-body');
if (foodTableBody) {
    async function loadFood() {
        window.loadFood = loadFood;
        try {
            const querySnapshot = await getDocs(collection(db, "menu"));
            foodTableBody.innerHTML = '';
            
            if (querySnapshot.empty) {
                foodTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No food items found.</td></tr>';
                return;
            }

            querySnapshot.forEach((documentSnapshot) => {
                const item = documentSnapshot.data();
                const id = documentSnapshot.id;
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors";
                
                const normalized = normalizeOptions(item.options);
                const optCount = normalized.length > 0 ? `<span class="text-xs bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded-full ml-1">${normalized.length} opt groups</span>` : '';

                tr.innerHTML = `
                    <td class="py-3 px-4"><img src="${item.image}" class="w-12 h-12 object-cover rounded" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=100'"></td>
                    <td class="py-3 px-4">
                        <span class="font-bold text-white">${item.nameVi || ''}</span><br>
                        <span class="text-xs text-secondary">EN: ${item.nameEn || ''}</span><br>
                        <span class="text-xs text-secondary">FI: ${item.nameFi || ''}</span>
                    </td>
                    <td class="py-3 px-4">
                        <span class="font-bold text-white">VI: ${item.categoryVi || item.category || ''}</span><br>
                        <span class="text-xs text-secondary">EN: ${item.categoryEn || ''}</span><br>
                        <span class="text-xs text-secondary">FI: ${item.categoryFi || ''}</span>
                    </td>
                    <td class="py-3 px-4">\u20AC${(item.price || 0).toFixed(2)}</td>
                    <td class="py-3 px-4">${optCount || '<span class="text-xs text-secondary/50">None</span>'}</td>
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
                });

                foodTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading menu:", error);
            foodTableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Failed to load menu.</td></tr>';
        }
    }

    window.deleteFood = async function(id) {
        if(confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, "menu", id));
                window.showNotification('Deleted successfully.', 'success');
                loadFood();
                loadCategories();
            } catch(e) {
                console.error("Delete error:", e);
                window.showNotification('Failed to delete.', 'error');
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
                        loadCategories();
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

    // --- EDIT MODAL LOGIC ---
    let editOptions = [];
    let editAddingChoices = [];
    let editCompressedImage = '';

    window.openEditModal = function(id, item) {
        const modal = document.getElementById('edit-modal');
        if (!modal) return;
        
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

    // Choices builder inside Edit Modal
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
                <span>${ch.labelVi} / ${ch.labelEn} / ${ch.labelFi} (${ch.price > 0 ? '+' + ch.price.toFixed(2) + '€' : 'Free'})</span>
                <button type="button" class="text-red-400 hover:text-red-300 px-1 font-bold" data-idx="${idx}">&times;</button>
            `;
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
            
            if (!labelVi && !labelEn && !labelFi) {
                window.showNotification('Please enter a choice label in at least one language.', 'info');
                return;
            }
            
            const safeVi = labelVi || labelEn || labelFi;
            const safeEn = labelEn || safeVi;
            const safeFi = labelFi || safeVi;
            
            editAddingChoices.push({
                label: safeEn,
                labelVi: safeVi,
                labelEn: safeEn,
                labelFi: safeFi,
                price: priceVal
            });
            
            document.getElementById('edit-new-choice-label-vi').value = '';
            document.getElementById('edit-new-choice-label-en').value = '';
            document.getElementById('edit-new-choice-label-fi').value = '';
            editChoicePriceInput.value = '';
            renderEditAddingChoices();
        });
    }

    // Option groups builder inside Edit Modal
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
                `<span class="inline-block bg-gray-800 text-secondary text-[10px] px-1.5 py-0.5 rounded mr-1">
                    ${c.labelVi || c.label} (${c.price > 0 ? '+' + c.price.toFixed(2) + '€' : 'Free'})
                 </span>`
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
                </button>
            `;
            div.querySelector('button').addEventListener('click', () => {
                editOptions.splice(idx, 1);
                renderEditOptions();
            });
            editOptionsList.appendChild(div);
        });
    }

    if (btnEditAddOpt) {
        btnEditAddOpt.addEventListener('click', () => {
            const nameVi = document.getElementById('edit-new-opt-name-vi').value.trim();
            const nameEn = document.getElementById('edit-new-opt-name-en').value.trim();
            const nameFi = document.getElementById('edit-new-opt-name-fi').value.trim();
            const type = editOptTypeSelect.value;
            
            if (!nameVi && !nameEn && !nameFi) {
                window.showNotification('Please enter an option group name in at least one language.', 'info');
                return;
            }
            if (editAddingChoices.length === 0) {
                window.showNotification('Please add at least one choice to this option group.', 'info');
                return;
            }
            
            const safeVi = nameVi || nameEn || nameFi;
            const safeEn = nameEn || safeVi;
            const safeFi = nameFi || safeVi;
            
            editOptions.push({
                name: safeEn,
                nameVi: safeVi,
                nameEn: safeEn,
                nameFi: safeFi,
                type,
                choices: [...editAddingChoices]
            });
            
            document.getElementById('edit-new-opt-name-vi').value = '';
            document.getElementById('edit-new-opt-name-en').value = '';
            document.getElementById('edit-new-opt-name-fi').value = '';
            editAddingChoices = [];
            renderEditAddingChoices();
            renderEditOptions();
        });
    }

    // Image compression for edit
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

    // Submit edit form
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
                    category: categoryVi,
                    categoryVi: categoryVi,
                    categoryEn: categoryEn || categoryVi,
                    categoryFi: categoryFi || categoryVi,
                    price: parseFloat(document.getElementById('edit-price').value) || 0,
                    options: [...editOptions]
                };

                if (editCompressedImage) {
                    updateData.image = editCompressedImage;
                }

                await updateDoc(doc(db, "menu", id), updateData);
                window.showNotification('Food item updated successfully!', 'success');
                window.closeEditModal();
                loadFood();
                loadCategories();
            } catch (err) {
                console.error("Edit error:", err);
                window.showNotification('Failed to update. Check console.', 'error');
            } finally {
                loading?.classList.add('hidden');
            }
        });
    }

    loadFood();
}

// --- FLOATING AI ADMIN CHAT (MESSENGER-STYLE) ---
(function() {
    // Inject custom styles for Messenger chat box
    const style = document.createElement('style');
    style.textContent = `
        .admin-chat-window {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.08);
            background-color: #121824;
            color: #f3f4f6;
            display: none;
            flex-direction: column;
            width: 380px;
            height: 520px;
            position: fixed;
            bottom: 90px;
            right: 24px;
            z-index: 10000;
            border-radius: 16px;
            overflow: hidden;
            font-family: 'Inter', sans-serif;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            opacity: 0;
            transform: translateY(20px) scale(0.95);
        }
        .admin-chat-window.show {
            display: flex;
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        .admin-chat-bubble {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13px;
            line-height: 1.45;
            word-wrap: break-word;
            margin-bottom: 2px;
        }
        .bubble-user {
            background-color: #3b82f6;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
        }
        .bubble-ai {
            background-color: #1e293b;
            color: #e5e7eb;
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            border: 1px solid rgba(255,255,255,0.03);
        }
        .chat-toggle-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #3b82f6;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.5);
            z-index: 10000;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease;
        }
        .chat-toggle-btn:hover {
            transform: scale(1.06);
            background-color: #2563eb;
        }
        .chat-toggle-btn:active {
            transform: scale(0.94);
        }
        .dots-loader span {
            width: 6px;
            height: 6px;
            margin: 0 2px;
            background-color: #9ca3af;
            border-radius: 50%;
            display: inline-block;
            animation: bounceDots 1.4s infinite both;
        }
        .dots-loader span:nth-child(2) { animation-delay: .2s; }
        .dots-loader span:nth-child(3) { animation-delay: .4s; }
        @keyframes bounceDots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    // Create and Inject HTML Markup
    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = `
        <div class="chat-toggle-btn animate-bounce" id="admin-chat-toggle" style="animation-duration: 2s;">
            <span class="material-symbols-outlined text-[28px]" id="chat-icon">chat</span>
        </div>
        <div class="admin-chat-window" id="admin-chat-win">
            <!-- Header -->
            <div class="p-4 bg-[#1e293b] border-b border-gray-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="font-bold text-white text-sm">Pho Viet Khang Assistant</span>
                </div>
                <button id="admin-chat-close" class="text-secondary hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
            <!-- Message Area -->
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3" id="admin-chat-messages">
                <div class="admin-chat-bubble bubble-ai">
                    Xin chào! Tôi là Trợ lý AI của Phố Việt Khang. Tôi có thể hỗ trợ bạn kiểm tra đơn hàng hôm nay hoặc cập nhật giá cả các món ăn trực tiếp. Bạn cần giúp gì?
                </div>
            </div>
            
            <!-- Input Bar -->
            <div class="p-3 border-t border-gray-800 bg-[#121824] flex gap-2 relative">
                <input type="file" id="admin-chat-file" accept="image/*,.doc,.docx,.xls,.xlsx,.csv" class="hidden">
                <button id="admin-chat-attach" class="bg-[#1e293b] hover:bg-gray-700 text-secondary hover:text-white p-2 rounded-xl border border-gray-700 transition-colors flex items-center justify-center" title="Đính kèm (Ảnh, Word, Excel)">
                    <span class="material-symbols-outlined text-[18px]">attach_file</span>
                </button>
                <input type="text" id="admin-chat-input" placeholder="Hỏi về đơn hàng, chỉnh giá sốt..." class="flex-1 bg-[#0b0f19] border border-gray-700 rounded-xl text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                <button id="admin-chat-send" class="bg-primary hover:bg-blue-600 text-white p-2 rounded-xl transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-[18px]">send</span>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(chatContainer);

    const toggleBtn = document.getElementById('admin-chat-toggle');
    const chatWin = document.getElementById('admin-chat-win');
    const closeBtn = document.getElementById('admin-chat-close');
    const chatInput = document.getElementById('admin-chat-input');
    const sendBtn = document.getElementById('admin-chat-send');
    const msgArea = document.getElementById('admin-chat-messages');
    const chatIcon = document.getElementById('chat-icon');
    const attachBtn = document.getElementById('admin-chat-attach');
    const fileInput = document.getElementById('admin-chat-file');

    // Dynamic Script Loader for Document Parsers
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Handle File Attachment
    attachBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const attachIcon = attachBtn.querySelector('span');
        const originalIcon = attachIcon.textContent;
        attachIcon.textContent = 'hourglass_empty';
        attachIcon.classList.add('animate-spin');
        chatInput.placeholder = 'Đang xử lý file...';
        chatInput.disabled = true;

        try {
            const ext = file.name.split('.').pop().toLowerCase();
            
            // 1. Handle Images (Convert to Base64 using Canvas)
            if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        const MAX_HEIGHT = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // Compress to WebP or JPEG with 0.8 quality to save Firestore space
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // Store the Base64 securely in a global object and give AI a lightweight token reference
                        window.__uploadedImages = window.__uploadedImages || {};
                        const imgId = "ATTACHED_IMAGE_" + Date.now();
                        window.__uploadedImages[imgId] = dataUrl;
                        
                        chatInput.value += (chatInput.value ? ' ' : '') + `[Ảnh đính kèm: ${imgId}] `;
                        
                        // Cleanup UI after Base64 processing completes
                        attachIcon.classList.remove('animate-spin');
                        attachIcon.textContent = originalIcon;
                        chatInput.placeholder = 'Hỏi về đơn hàng, chỉnh giá sốt...';
                        chatInput.disabled = false;
                        chatInput.focus();
                        fileInput.value = '';
                    };
                    img.onerror = () => {
                        alert("Lỗi khi đọc file ảnh!");
                        attachIcon.classList.remove('animate-spin');
                        attachIcon.textContent = originalIcon;
                        chatInput.disabled = false;
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
                return; // Return early because FileReader is asynchronous, the finally block will be handled inside reader.onload
            }
            // 2. Handle Word (.docx)
            else if (ext === 'docx' || ext === 'doc') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                chatInput.value += (chatInput.value ? '\\n' : '') + `[Nội dung file Word ${file.name}:\\n${result.value}]\\n`;
            }
            // 3. Handle Excel (.xlsx, .xls, .csv)
            else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const csvStr = XLSX.utils.sheet_to_csv(worksheet);
                chatInput.value += (chatInput.value ? '\\n' : '') + `[Nội dung file Excel ${file.name}:\\n${csvStr}]\\n`;
            }
            else {
                alert('Định dạng file không được hỗ trợ!');
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi xử lý file: ' + err.message);
        } finally {
            attachIcon.classList.remove('animate-spin');
            attachIcon.textContent = originalIcon;
            chatInput.placeholder = 'Hỏi về đơn hàng, chỉnh giá sốt...';
            chatInput.disabled = false;
            chatInput.focus();
            fileInput.value = ''; // Reset input
        }
    });


    // Toggle logic
    toggleBtn.addEventListener('click', () => {
        if (chatWin.classList.contains('show')) {
            chatWin.classList.remove('show');
            setTimeout(() => chatWin.style.display = 'none', 250);
            chatIcon.textContent = 'chat';
        } else {
            chatWin.style.display = 'flex';
            // Force reflow
            chatWin.offsetHeight;
            chatWin.classList.add('show');
            chatIcon.textContent = 'keyboard_arrow_down';
            chatInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        chatWin.classList.remove('show');
        setTimeout(() => chatWin.style.display = 'none', 250);
        chatIcon.textContent = 'chat';
    });

    // --- Cloudflare Worker proxy helper ---
    // (callWorker is defined at top of file)

    // Chat context
    const chatMessages = [
        {
            role: 'system',
            content: `You are a helpful Vietnamese restaurant AI Admin Assistant for Phở Việt Khang restaurant.
You have full access to Firebase tools that can manage orders, food menu, AND Firebase Auth user accounts with real admin privileges.
You MUST answer in Vietnamese.

IMPORTANT: Whenever you need data or need to make changes, you MUST call the appropriate tool(s). Do NOT make up data.
To call a tool, output a <tool_call> JSON block:
<tool_call>
{
  "tool": "tool_name",
  "args": { "arg1": "value1" }
}
</tool_call>

Rules:
- You CAN output multiple <tool_call> blocks in one turn — they run in parallel.
- When outputting tool calls, output ONLY the <tool_call> blocks, nothing else.
- After receiving tool results, formulate your final Vietnamese response.
- You MAY call tools again in a subsequent turn if you need more information.

═══════════════════════════════════════════════
📦 ORDER TOOLS
═══════════════════════════════════════════════
1. getOrdersSoldToday()
   Args: {}
   Returns today's orders: count, total revenue, and list.

2. getOrdersByStatus(status)
   Args: { "status": string }  // "pending", "preparing", "completed", "cancelled"
   Returns orders matching a status.

3. updateOrderStatus(orderId, newStatus)
   Args: { "orderId": string, "newStatus": string }
   Updates an order's status.

4. deleteOrder(orderId)
   Args: { "orderId": string }
   Permanently deletes an order.

═══════════════════════════════════════════════
🍜 MENU TOOLS
═══════════════════════════════════════════════
5. listAllFoodItems()
   Args: {}
   Returns all food items with IDs, prices, categories, and options.

6. updateMenuPrice(dishId, newPrice)
   Args: { "dishId": string, "newPrice": number }
   Updates the base price of a dish.

6b. createMenuItem(nameVi, price, categoryVi, descriptionVi, imageUrl)
   Args: { "nameVi": string, "price": number, "categoryVi": string, "descriptionVi": string, "imageUrl": string }
   Creates a brand new menu item with the provided details. If the user attaches an image, use the provided ID (e.g., "ATTACHED_IMAGE_123456").

7. setOptionChoicePrice(dishId, optionName, choiceLabel, newPrice)
   Args: { "dishId": string, "optionName": string, "choiceLabel": string, "newPrice": number }
   Updates the price of a specific choice within an option group.

8. addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices)
   Args: { "dishId": string, "optionNameVi": string, "optionNameEn": string, "optionNameFi": string, "optionType": string, "choices": array of { labelVi: string, labelEn: string, labelFi: string, price: number } }
   Adds a brand new option group in 3 languages (e.g. names for Spicy Level, type "single-select" or "toggle") with localized initial choices.

9. removeMenuOptionGroup(dishId, optionName)
   Args: { "dishId": string, "optionName": string }
   Removes an entire option group by its name (any language) from a dish.

10. addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choicePrice)
    Args: { "dishId": string, "optionName": string, "choiceLabelVi": string, "choiceLabelEn": string, "choiceLabelFi": string, "choicePrice": number }
    Adds a new choice in 3 languages into an existing option group.

11. removeChoiceFromOptionGroup(dishId, optionName, choiceLabel)
    Args: { "dishId": string, "optionName": string, "choiceLabel": string }
    Removes a choice (any language) from an option group.

11b. updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionType)
    Args: { "dishId": string, "oldOptionName": string, "newOptionNameVi": string, "newOptionNameEn": string, "newOptionNameFi": string, "newOptionType": string }
    Renames an option group and/or changes its type.

11c. updateChoiceInOptionGroup(dishId, optionName, oldChoiceLabel, newChoiceLabelVi, newChoiceLabelEn, newChoiceLabelFi, newChoicePrice)
    Args: { "dishId": string, "optionName": string, "oldChoiceLabel": string, "newChoiceLabelVi": string, "newChoiceLabelEn": string, "newChoiceLabelFi": string, "newChoicePrice": number }
    Updates choice labels in 3 languages and/or updates choice price.

11d. updateMenuName(dishId, nameVi, nameEn, nameFi)
    Args: { "dishId": string, "nameVi": string, "nameEn": string, "nameFi": string }
    Updates the dish name in 3 languages.

11e. updateMenuDescription(dishId, descriptionVi, descriptionEn, descriptionFi)
    Args: { "dishId": string, "descriptionVi": string, "descriptionEn": string, "descriptionFi": string }
    Updates the dish description in 3 languages.

11f. updateMenuCategory(dishId, categoryVi, categoryEn, categoryFi)
    Args: { "dishId": string, "categoryVi": string, "categoryEn": string, "categoryFi": string }
    Updates the dish category in 3 languages.

11g. updateMenuAvailability(dishId, isAvailable)
    Args: { "dishId": string, "isAvailable": boolean }
    Sets if the dish is currently available or sold out.

11h. uploadMenuImage(dishId, imageUrl)
    Args: { "dishId": string, "imageUrl": string }
    Sets or updates the dish's visual image URL (supports hotlink/base64). If the user attaches an image, use the ID provided (e.g., "ATTACHED_IMAGE_123456") directly as the imageUrl.

11i. removeMenuImage(dishId)
    Args: { "dishId": string }
    Resets the dish's image back to the default fallback placeholder.

11j. updateMenuPreparationTime(dishId, minutes)
    Args: { "dishId": string, "minutes": number }
    Sets the preparation time for the dish (in minutes).

11k. updateMenuNutritionInfo(dishId, calories, protein, fat, carbs)
    Args: { "dishId": string, "calories": number, "protein": number, "fat": number, "carbs": number }
    Sets calories (kcal), protein (g), fat (g), and carbs (g) values.

11l. addMenuTag(dishId, tagLabelVi, tagLabelEn, tagLabelFi)
    Args: { "dishId": string, "tagLabelVi": string, "tagLabelEn": string, "tagLabelFi": string }
    Adds a trilingual tag like vegan or spicy to the dish.

11m. removeMenuTag(dishId, tagLabel)
    Args: { "dishId": string, "tagLabel": string }
    Removes a tag from the dish by matching tag label (any language).

11n. reorderMenuItems(orderedDishIds)
    Args: { "orderedDishIds": array of strings }
    Updates sorting order of dish IDs to match their position in the array.

11o. duplicateMenuItem(dishId)
    Args: { "dishId": string }
    Duplicates a menu item (clones document and appends " (Bản sao)").

11p. deleteMenuItem(dishId)
    Args: { "dishId": string }
    Permanently deletes a dish item from the menu.

11q. updateMenuCustomFields(dishId, customFields)
    Args: { "dishId": string, "customFields": object }
    Updates any other custom metadata fields in the menu item.

═══════════════════════════════════════════════
🏠 HOMEPAGE CONFIG TOOLS
═══════════════════════════════════════════════
11r. updateHomepageHero(imageUrl, titleVi, titleEn, titleFi, descVi, descEn, descFi)
    Args: { "imageUrl": string, "titleVi": string, "titleEn": string, "titleFi": string, "descVi": string, "descEn": string, "descFi": string }
    Updates the hero background image and text on the main index page in 3 languages. If the user attaches an image, use the provided ID (e.g., "ATTACHED_IMAGE_123456").

11s. updateHomepageSignatures(dishIdArray)
    Args: { "dishIdArray": array of strings }
    Sets the featured signature dishes on the homepage using their dish IDs.

11t. updateHomepageSignatureText(titleVi, titleEn, titleFi, descVi, descEn, descFi)
    Args: { "titleVi": string, "titleEn": string, "titleFi": string, "descVi": string, "descEn": string, "descFi": string }
    Updates the title and description text for the Signature Creations section in 3 languages.

11u. updateHomepageStory(imageUrl, labelVi, labelEn, labelFi, titleVi, titleEn, titleFi, p1Vi, p1En, p1Fi, p2Vi, p2En, p2Fi)
    Args: { "imageUrl": string, "labelVi": string, "labelEn": string, "labelFi": string, "titleVi": string, "titleEn": string, "titleFi": string, "p1Vi": string, "p1En": string, "p1Fi": string, "p2Vi": string, "p2En": string, "p2Fi": string }
    Updates the "Our Heritage" story section on the homepage in 3 languages. If the user attaches an image, use the provided ID.

11v. updateHomepageCTA(titleVi, titleEn, titleFi, descVi, descEn, descFi)
    Args: { "titleVi": string, "titleEn": string, "titleFi": string, "descVi": string, "descEn": string, "descFi": string }
    Updates the "Experience the Full Journey" Call to Action section on the homepage in 3 languages.

═══════════════════════════════════════════════
👥 USER / FIRESTORE TOOLS
═══════════════════════════════════════════════
12. listAllUsers()
    Args: {}
    Returns all users from Firestore (uid, email, name, role).

13. changeUserRole(uid, newRole)
    Args: { "uid": string, "newRole": string }  // "admin", "customer", "kitchen", "host"
    Changes the user's role in Firestore.

14. createUserAccount(email, password, name, role)
    Args: { "email": string, "password": string, "name": string, "role": string }
    Creates a full Firebase Auth account AND Firestore profile.

15. sendPasswordReset(email)
    Args: { "email": string }
    Sends a password reset email to the user.

15b. createCustomVoucher(email, discountPercent, expiryDays, allowedTypes)
    Args: { "email": string, "discountPercent": number, "expiryDays": number, "allowedTypes": array of strings }
    Creates a new custom voucher with a percentage discount, optional expiration in days, and restricted dining/order types (dine-in, takeaway, delivery). If allowedTypes is empty, it applies to all types.

15c. sendSpinsToUser(uidOrEmail, spinType, count)
    Args: { "uidOrEmail": string, "spinType": string, "count": number }
    Sends Lucky Wheel spins to a user by UID or email. spinType must be: "deu" (Normal), "xin" (Good), or "vip" (VIP).

15d. sendGlobalAnnouncement(title, text, imageUrl)
    Args: { "title": string, "text": string, "imageUrl": string }
    Sends a broadcast inbox message to all registered users. Use this for general announcements. If the user attaches an image, use the provided ID.

═══════════════════════════════════════════════
🔥 FIREBASE ADMIN TOOLS (Real Auth Management)
═══════════════════════════════════════════════
16. adminListAuthUsers()
    Args: {}
    Lists ALL Firebase Auth users with disabled status, email verification, and sign-in time.
    Use this to see which accounts are disabled or unverified.

17. adminDeleteAuthUser(uid)
    Args: { "uid": string }
    PERMANENTLY deletes the Firebase Auth account AND Firestore profile. Cannot be undone.

18. adminDisableUser(uid)
    Args: { "uid": string }
    Disables a Firebase Auth account (blocks login). The account still exists.

19. adminEnableUser(uid)
    Args: { "uid": string }
    Re-enables a previously disabled Firebase Auth account.

20. adminChangeUserPassword(uid, newPassword)
    Args: { "uid": string, "newPassword": string }  // min 6 chars
    Changes the password of ANY user directly on Firebase Auth (no email needed).

21. adminChangeUserEmail(uid, newEmail)
    Args: { "uid": string, "newEmail": string }
    Changes the Firebase Auth email AND syncs to Firestore.

22. adminVerifyUserEmail(uid)
    Args: { "uid": string }
    Force-marks a user's email as verified on Firebase Auth.

23. adminSetCustomClaims(uid, claims)
    Args: { "uid": string, "claims": object }  // e.g. { "superadmin": true }
    Sets custom JWT claims on a Firebase Auth user.

24. adminGetUserInfo(uid?, email?)
    Args: { "uid": string } OR { "email": string }
    Gets detailed Firebase Auth record for one user.

25. adminRevokeUserTokens(uid)
    Args: { "uid": string }
    Revokes all refresh tokens = forces the user to log out on ALL devices immediately.

26. adminUpdateDisplayName(uid, displayName)
    Args: { "uid": string, "displayName": string }
    Updates display name in both Firebase Auth and Firestore.

27. adminGenerateCustomToken(uid)
    Args: { "uid": string }
    Generates a custom sign-in token for testing/impersonation.

═══════════════════════════════════════════════
🔧 CURRENT ADMIN SELF-MANAGEMENT
═══════════════════════════════════════════════
28. changeCurrentAdminPassword(newPassword)
    Args: { "newPassword": string }
    Changes YOUR OWN admin password.

29. updateCurrentAdminEmail(newEmail)
    Args: { "newEmail": string }
    Changes YOUR OWN admin email.

30. updateCurrentAdminProfile(name)
    Args: { "name": string }
    Changes YOUR OWN display name.

═══════════════════════════════════════════════
🌐 WEB SEARCH & BROWSER TOOLS
═══════════════════════════════════════════════
31. webSearch(query)
    Args: { "query": string }
    Searches the web for news, menu items, or competitor information.

32. browseWebUrl(url)
    Args: { "url": string }
    Reads the content of any website by URL (returns cleaned main text content).
`
        }
    ];

    // Tool Implementations
    async function updateHomepageHero(imageUrl, titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            await setDoc(doc(db, "config", "homepage"), {
                heroBgUrl: imageUrl || null,
                heroTitleVi: titleVi || null,
                heroTitleEn: titleEn || null,
                heroTitleFi: titleFi || null,
                heroDescVi: descVi || null,
                heroDescEn: descEn || null,
                heroDescFi: descFi || null
            }, { merge: true });
            return { success: true, message: "Homepage hero updated successfully." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateHomepageSignatures(dishIdArray) {
        try {
            if (!Array.isArray(dishIdArray)) return { error: "dishIdArray must be an array of strings" };
            await setDoc(doc(db, "config", "homepage"), {
                signatureDishIds: dishIdArray
            }, { merge: true });
            return { success: true, message: "Homepage signatures updated successfully." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateHomepageSignatureText(titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            await setDoc(doc(db, "config", "homepage"), {
                signatureTitleVi: titleVi || null,
                signatureTitleEn: titleEn || null,
                signatureTitleFi: titleFi || null,
                signatureDescVi: descVi || null,
                signatureDescEn: descEn || null,
                signatureDescFi: descFi || null
            }, { merge: true });
            return { success: true, message: "Homepage signature text updated successfully. Reload to see." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateHomepageStory(imageUrl, labelVi, labelEn, labelFi, titleVi, titleEn, titleFi, p1Vi, p1En, p1Fi, p2Vi, p2En, p2Fi) {
        try {
            await setDoc(doc(db, "config", "homepage"), {
                storyImg: imageUrl || null,
                storyLabelVi: labelVi || null,
                storyLabelEn: labelEn || null,
                storyLabelFi: labelFi || null,
                storyTitleVi: titleVi || null,
                storyTitleEn: titleEn || null,
                storyTitleFi: titleFi || null,
                storyP1Vi: p1Vi || null,
                storyP1En: p1En || null,
                storyP1Fi: p1Fi || null,
                storyP2Vi: p2Vi || null,
                storyP2En: p2En || null,
                storyP2Fi: p2Fi || null
            }, { merge: true });
            return { success: true, message: "Homepage story section updated successfully. Reload to see." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateHomepageCTA(titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            await setDoc(doc(db, "config", "homepage"), {
                ctaTitleVi: titleVi || null,
                ctaTitleEn: titleEn || null,
                ctaTitleFi: titleFi || null,
                ctaDescVi: descVi || null,
                ctaDescEn: descEn || null,
                ctaDescFi: descFi || null
            }, { merge: true });
            return { success: true, message: "Homepage CTA section updated successfully. Reload to see." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function createMenuItem(nameVi, price, categoryVi, descriptionVi, imageUrl) {
        try {
            const newItemRef = doc(collection(db, "menu"));
            await setDoc(newItemRef, {
                nameVi: nameVi || "",
                nameEn: "",
                nameFi: "",
                price: parseFloat(price) || 0,
                categoryVi: categoryVi || "",
                categoryEn: "",
                categoryFi: "",
                descriptionVi: descriptionVi || "",
                descriptionEn: "",
                descriptionFi: "",
                image: imageUrl || "",
                isAvailable: true,
                preparationTime: 15,
                nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 },
                tags: []
            });
            return { success: true, message: `Menu item created successfully with ID: ${newItemRef.id}` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function sendGlobalAnnouncement(title, text, imageUrl) {
        try {
            await addDoc(collection(db, "messages"), {
                title: title || "Thông báo từ Nhà hàng",
                text: text || "",
                imageUrl: imageUrl || null,
                voucherCode: null,
                giftSpins: null,
                recipientId: 'all',
                readBy: [],
                createdAt: new Date()
            });
            return { success: true, message: "Global announcement sent to all users successfully." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function getOrdersSoldToday() {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const qSnap = await getDocs(collection(db, "orders"));
            let count = 0;
            let totalRevenue = 0;
            const list = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                let orderDate = null;
                if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                    orderDate = data.createdAt.toDate();
                } else if (data.createdAt) {
                    orderDate = new Date(data.createdAt);
                }
                if (orderDate && orderDate >= today) {
                    count++;
                    totalRevenue += data.totalPrice || 0;
                    list.push({
                        id: docSnap.id,
                        customerName: data.customerName,
                        totalPrice: data.totalPrice,
                        items: data.items ? data.items.map(i => `${i.name} (x${i.qty})`).join(', ') : '',
                        status: data.status,
                        time: orderDate.toLocaleTimeString()
                    });
                }
            });
            return { count, totalRevenue, orders: list };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function listAllFoodItems() {
        try {
            const qSnap = await getDocs(collection(db, "menu"));
            const items = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                items.push({
                    id: docSnap.id,
                    nameVi: data.nameVi || '',
                    nameEn: data.nameEn || '',
                    nameFi: data.nameFi || '',
                    category: data.category || '',
                    categoryVi: data.categoryVi || '',
                    categoryEn: data.categoryEn || '',
                    categoryFi: data.categoryFi || '',
                    price: data.price,
                    options: data.options || []
                });
            });
            return items;
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function setOptionChoicePrice(dishId, optionName, choiceLabel, newPrice) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Dish not found" };
            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    opt.choices = opt.choices.map(c => {
                        const matchesChoice = (c.label || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelVi || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelEn || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelFi || '').toLowerCase() === choiceLabel.toLowerCase();
                        if (matchesChoice) {
                            c.price = parseFloat(newPrice);
                            updated = true;
                        }
                        return c;
                    });
                }
                return opt;
            });
            if (!updated) return { error: "Option or choice not found" };
            await updateDoc(docRef, { options });
            
            // Reload page list if we are on food-list
            if (typeof window.loadFood === 'function') window.loadFood();
            
            return { success: true, message: `Set option choice price for ${choiceLabel} to ${newPrice} EUR successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            const nameVi = optionNameVi || '';
            const nameEn = optionNameEn || nameVi;
            const nameFi = optionNameFi || nameVi;
            
            const options = normalizeOptions(targetDoc.options || []);
            // Check if group already exists in any language
            const exists = options.some(opt => 
                (opt.nameVi || '').toLowerCase() === nameVi.toLowerCase() ||
                (opt.nameEn || '').toLowerCase() === nameEn.toLowerCase()
            );
            if (exists) return { error: `Nhóm option "${nameVi}" đã tồn tại.` };
            
            options.push({
                name: nameEn,
                nameVi: nameVi,
                nameEn: nameEn,
                nameFi: nameFi,
                type: optionType || 'toggle',
                choices: Array.isArray(choices) ? choices.map(c => {
                    const lVi = c.labelVi || c.label || '';
                    const lEn = c.labelEn || c.label || lVi;
                    const lFi = c.labelFi || c.label || lVi;
                    return {
                        label: lEn,
                        labelVi: lVi,
                        labelEn: lEn,
                        labelFi: lFi,
                        price: parseFloat(c.price) || 0
                    };
                }) : []
            });
            
            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã thêm nhóm option "${nameVi}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeMenuOptionGroup(dishId, optionName) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            const options = normalizeOptions(targetDoc.options || []);
            const originalLength = options.length;
            const updatedOptions = options.filter(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                return !matchesOpt;
            });
            
            if (originalLength === updatedOptions.length) {
                return { error: `Không tìm thấy nhóm option "${optionName}".` };
            }
            
            await updateDoc(docRef, { options: updatedOptions });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã xoá nhóm option "${optionName}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choicePrice) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    const lVi = choiceLabelVi || '';
                    const lEn = choiceLabelEn || lVi;
                    const lFi = choiceLabelFi || lVi;
                    
                    // Check if choice already exists in any language
                    const exists = opt.choices.some(c => 
                        (c.label || '').toLowerCase() === lEn.toLowerCase() ||
                        (c.labelVi || '').toLowerCase() === lVi.toLowerCase()
                    );
                    if (!exists) {
                        opt.choices.push({
                            label: lEn,
                            labelVi: lVi,
                            labelEn: lEn,
                            labelFi: lFi,
                            price: parseFloat(choicePrice) || 0
                        });
                        updated = true;
                    }
                }
                return opt;
            });
            
            if (!updated) return { error: `Nhóm option "${optionName}" không tồn tại hoặc lựa chọn "${choiceLabelVi}" đã có sẵn.` };
            
            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã thêm lựa chọn "${choiceLabelVi}" vào nhóm "${optionName}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeChoiceFromOptionGroup(dishId, optionName, choiceLabel) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    const originalLength = opt.choices.length;
                    opt.choices = opt.choices.filter(c => {
                        const matchesChoice = (c.label || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelVi || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelEn || '').toLowerCase() === choiceLabel.toLowerCase() ||
                                              (c.labelFi || '').toLowerCase() === choiceLabel.toLowerCase();
                        return !matchesChoice;
                    });
                    if (opt.choices.length < originalLength) {
                        updated = true;
                    }
                }
                return opt;
            });
            
            if (!updated) return { error: `Không tìm thấy nhóm "${optionName}" hoặc lựa chọn "${choiceLabel}".` };
            
            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã xoá lựa chọn "${choiceLabel}" khỏi nhóm "${optionName}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionType) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === oldOptionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === oldOptionName.toLowerCase();
                if (matchesOpt) {
                    if (newOptionNameVi) opt.nameVi = newOptionNameVi;
                    if (newOptionNameEn) {
                        opt.nameEn = newOptionNameEn;
                        opt.name = newOptionNameEn;
                    }
                    if (newOptionNameFi) opt.nameFi = newOptionNameFi;
                    if (newOptionType) opt.type = newOptionType;
                    updated = true;
                }
                return opt;
            });
            
            if (!updated) return { error: `Không tìm thấy nhóm option "${oldOptionName}".` };
            
            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật nhóm option "${oldOptionName}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateChoiceInOptionGroup(dishId, optionName, oldChoiceLabel, newChoiceLabelVi, newChoiceLabelEn, newChoiceLabelFi, newChoicePrice) {
        try {
            const docRef = doc(db, "menu", dishId);
            const qSnap = await getDocs(collection(db, "menu"));
            let targetDoc = null;
            qSnap.forEach(d => {
                if (d.id === dishId) targetDoc = d.data();
            });
            if (!targetDoc) return { error: "Không tìm thấy món ăn." };
            
            let updated = false;
            const options = normalizeOptions(targetDoc.options || []).map(opt => {
                const matchesOpt = (opt.name || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameVi || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameEn || '').toLowerCase() === optionName.toLowerCase() ||
                                   (opt.nameFi || '').toLowerCase() === optionName.toLowerCase();
                if (matchesOpt) {
                    opt.choices = opt.choices.map(c => {
                        const matchesChoice = (c.label || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelVi || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelEn || '').toLowerCase() === oldChoiceLabel.toLowerCase() ||
                                              (c.labelFi || '').toLowerCase() === oldChoiceLabel.toLowerCase();
                        if (matchesChoice) {
                            if (newChoiceLabelVi) c.labelVi = newChoiceLabelVi;
                            if (newChoiceLabelEn) {
                                c.labelEn = newChoiceLabelEn;
                                c.label = newChoiceLabelEn;
                            }
                            if (newChoiceLabelFi) c.labelFi = newChoiceLabelFi;
                            if (newChoicePrice !== undefined && newChoicePrice !== null) c.price = parseFloat(newChoicePrice);
                            updated = true;
                        }
                        return c;
                    });
                }
                return opt;
            });
            
            if (!updated) return { error: `Không tìm thấy lựa chọn "${oldChoiceLabel}" trong nhóm "${optionName}".` };
            
            await updateDoc(docRef, { options });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật lựa chọn "${oldChoiceLabel}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuName(dishId, nameVi, nameEn, nameFi) {
        try {
            const docRef = doc(db, "menu", dishId);
            const updateData = {};
            if (nameVi !== undefined) updateData.nameVi = nameVi;
            if (nameEn !== undefined) updateData.nameEn = nameEn;
            if (nameFi !== undefined) updateData.nameFi = nameFi;
            await updateDoc(docRef, updateData);
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật tên món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuDescription(dishId, descriptionVi, descriptionEn, descriptionFi) {
        try {
            const docRef = doc(db, "menu", dishId);
            const updateData = {};
            if (descriptionVi !== undefined) updateData.descVi = descriptionVi;
            if (descriptionEn !== undefined) updateData.descEn = descriptionEn;
            if (descriptionFi !== undefined) updateData.descFi = descriptionFi;
            await updateDoc(docRef, updateData);
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật mô tả món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuCategory(dishId, categoryVi, categoryEn, categoryFi) {
        try {
            const docRef = doc(db, "menu", dishId);
            const updateData = {};
            if (categoryVi !== undefined) {
                updateData.category = categoryVi;
                updateData.categoryVi = categoryVi;
                if (!categoryEn) updateData.categoryEn = categoryVi;
                if (!categoryFi) updateData.categoryFi = categoryVi;
            }
            if (categoryEn !== undefined) updateData.categoryEn = categoryEn;
            if (categoryFi !== undefined) updateData.categoryFi = categoryFi;
            await updateDoc(docRef, updateData);
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật danh mục món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuAvailability(dishId, isAvailable) {
        try {
            const docRef = doc(db, "menu", dishId);
            await updateDoc(docRef, { isAvailable: !!isAvailable });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật trạng thái có sẵn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function uploadMenuImage(dishId, imageUrl) {
        try {
            const docRef = doc(db, "menu", dishId);
            await updateDoc(docRef, { image: imageUrl });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật ảnh món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeMenuImage(dishId, imageUrl) {
        try {
            const docRef = doc(db, "menu", dishId);
            const defaultImg = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500';
            await updateDoc(docRef, { image: defaultImg });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã xoá ảnh món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuPreparationTime(dishId, minutes) {
        try {
            const docRef = doc(db, "menu", dishId);
            await updateDoc(docRef, { preparationTime: parseInt(minutes) || 0 });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật thời gian chuẩn bị thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuNutritionInfo(dishId, calories, protein, fat, carbs) {
        try {
            const docRef = doc(db, "menu", dishId);
            const nutrition = {
                calories: parseFloat(calories) || 0,
                protein: parseFloat(protein) || 0,
                fat: parseFloat(fat) || 0,
                carbs: parseFloat(carbs) || 0
            };
            await updateDoc(docRef, { nutrition });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật thông tin dinh dưỡng thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function addMenuTag(dishId, tagLabelVi, tagLabelEn, tagLabelFi) {
        try {
            const docRef = doc(db, "menu", dishId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return { error: "Không tìm thấy món ăn." };
            const data = docSnap.data();
            const tags = Array.isArray(data.tags) ? data.tags : [];
            
            const lVi = tagLabelVi || '';
            const lEn = tagLabelEn || lVi;
            const lFi = tagLabelFi || lVi;
            
            const exists = tags.some(t => 
                (t.labelVi || '').toLowerCase() === lVi.toLowerCase() ||
                (t.labelEn || '').toLowerCase() === lEn.toLowerCase()
            );
            if (!exists) {
                tags.push({ labelVi: lVi, labelEn: lEn, labelFi: lFi });
                await updateDoc(docRef, { tags });
            }
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã thêm tag "${lVi}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function removeMenuTag(dishId, tagLabel) {
        try {
            const docRef = doc(db, "menu", dishId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return { error: "Không tìm thấy món ăn." };
            const data = docSnap.data();
            const tags = Array.isArray(data.tags) ? data.tags : [];
            const newTags = tags.filter(t => 
                (t.labelVi || '').toLowerCase() !== tagLabel.toLowerCase() &&
                (t.labelEn || '').toLowerCase() !== tagLabel.toLowerCase() &&
                (t.labelFi || '').toLowerCase() !== tagLabel.toLowerCase()
            );
            
            if (tags.length === newTags.length) {
                return { error: `Không tìm thấy tag "${tagLabel}".` };
            }
            
            await updateDoc(docRef, { tags: newTags });
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã xoá tag "${tagLabel}" thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function reorderMenuItems(orderedDishIds) {
        try {
            if (!Array.isArray(orderedDishIds)) return { error: "orderedDishIds phải là một mảng các IDs." };
            for (let i = 0; i < orderedDishIds.length; i++) {
                const dishId = orderedDishIds[i];
                await updateDoc(doc(db, "menu", dishId), { sortOrder: i });
            }
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: "Đã sắp xếp lại thứ tự hiển thị món ăn thành công." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function duplicateMenuItem(dishId, newDishId) {
        try {
            const docRef = doc(db, "menu", dishId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return { error: "Không tìm thấy món ăn để sao chép." };
            const data = docSnap.data();
            const newData = {
                ...data,
                nameVi: (data.nameVi || "") + " (Bản sao)",
                createdAt: new Date()
            };
            let targetId;
            if (newDishId) {
                await setDoc(doc(db, "menu", newDishId), newData);
                targetId = newDishId;
            } else {
                const newDocRef = await addDoc(collection(db, "menu"), newData);
                targetId = newDocRef.id;
            }
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã nhân bản món ăn thành công với ID mới: ${targetId}` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function deleteMenuItem(dishId) {
        try {
            await deleteDoc(doc(db, "menu", dishId));
            if (typeof window.loadFood === 'function') window.loadFood();
            if (typeof window.loadCategories === 'function') window.loadCategories();
            return { success: true, message: `Đã xoá hoàn toàn món ăn thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateMenuCustomFields(dishId, customFields) {
        try {
            const docRef = doc(db, "menu", dishId);
            if (typeof customFields !== 'object' || customFields === null) {
                return { error: "customFields phải là một object chứa các khoá cần cập nhật." };
            }
            await updateDoc(docRef, customFields);
            if (typeof window.loadFood === 'function') window.loadFood();
            return { success: true, message: `Đã cập nhật các trường tuỳ chỉnh thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function listAllUsers() {
        try {
            const qSnap = await getDocs(collection(db, "users"));
            const users = [];
            qSnap.forEach(d => {
                const data = d.data();
                users.push({
                    uid: d.id,
                    email: data.email,
                    name: data.name,
                    role: data.role
                });
            });
            return users;
        } catch (e) {
            return { error: e.message };
        }
    }

    async function changeUserRole(uid, newRole) {
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, { role: newRole });
            
            // Refresh list if on user-manager page
            if (typeof window.loadUsers === 'function') window.loadUsers();
            
            return { success: true, message: `Changed role of user ${uid} to ${newRole}.` };
        } catch (e) {
            return { error: e.message };
        }
    }

    async function deleteUserAccount(uid) {
        try {
            await deleteDoc(doc(db, "users", uid));
            
            // Refresh list if on user-manager page
            if (typeof window.loadUsers === 'function') window.loadUsers();
            
            return { success: true, message: `Deleted user profile for ${uid} from Firestore.` };
        } catch (e) {
            return { error: e.message };
        }
    }

    async function sendSpinsToUser(uidOrEmail, spinType, count) {
        try {
            const type = (spinType || 'deu').toLowerCase();
            if (!['deu', 'xin', 'vip'].includes(type)) {
                return { error: "Loại lượt quay không hợp lệ. Chỉ chấp nhận: deu, xin, vip" };
            }
            const qty = parseInt(count, 10) || 1;
            
            let uid = uidOrEmail;
            if (uidOrEmail.includes('@')) {
                const q = query(collection(db, "users"), where("email", "==", uidOrEmail.trim()));
                const snap = await getDocs(q);
                if (snap.empty) {
                    return { error: `Không tìm thấy user với email: ${uidOrEmail}` };
                }
                uid = snap.docs[0].id;
            }
            
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                return { error: `Không tìm thấy user với UID/Email: ${uidOrEmail}` };
            }
            
            const data = docSnap.data();
            const spins = data.spins || { deu: 0, xin: 0, vip: 0 };
            spins[type] = (spins[type] || 0) + qty;
            
            await updateDoc(docRef, { spins });
            return { success: true, message: `Đã gửi ${qty} lượt quay loại "${type}" cho user ${data.name || uid} thành công.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function createUserAccount(email, password, name, role) {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
            const { getAuth, createUserWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
            const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            
            const firebaseConfig = {
                apiKey: "AIzaSyCdrnjnOD2yvQm1WhQvL-G1FuZyatnDyZk",
                authDomain: "phovietkhang.firebaseapp.com",
                databaseURL: "https://phovietkhang-default-rtdb.firebaseio.com",
                projectId: "phovietkhang",
                storageBucket: "phovietkhang.firebasestorage.app",
                messagingSenderId: "402866883241",
                appId: "1:402866883241:web:c5aa837183dc2ecafcf7b8"
            };

            const tempAppName = "TempApp_" + Date.now();
            const tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
            const uid = userCredential.user.uid;

            await setDoc(doc(db, "users", uid), {
                uid: uid,
                email: email,
                name: name,
                role: role,
                spins: { deu: 1, xin: 0, vip: 0 },
                createdAt: new Date()
            });

            await signOut(tempAuth);

            // Refresh list if on user-manager page
            if (typeof window.loadUsers === 'function') window.loadUsers();

            return { success: true, message: `Created user ${name} (${email}) with role ${role} (UID: ${uid}) successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function sendPasswordReset(email) {
        try {
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js");
            const { getAuth, sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
            
            const firebaseConfig = {
                apiKey: "AIzaSyCdrnjnOD2yvQm1WhQvL-G1FuZyatnDyZk",
                authDomain: "phovietkhang.firebaseapp.com",
                databaseURL: "https://phovietkhang-default-rtdb.firebaseio.com",
                projectId: "phovietkhang",
                storageBucket: "phovietkhang.firebasestorage.app",
                messagingSenderId: "402866883241",
                appId: "1:402866883241:web:c5aa837183dc2ecafcf7b8"
            };

            const tempAppName = "TempResetApp_" + Date.now();
            const tempApp = initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            await sendPasswordResetEmail(tempAuth, email);
            return { success: true, message: `Sent password reset email to ${email} successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function createCustomVoucher(email, discountPercent, expiryDays, allowedTypes) {
        try {
            const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
            const percent = parseInt(discountPercent, 10) || 10;
            const code = `PROMO${percent}-${rand}`;
            
            let expiryDate = null;
            if (expiryDays && expiryDays !== 'never') {
                const days = parseInt(expiryDays, 10);
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + days);
            }
            
            const allowedOrderTypes = Array.isArray(allowedTypes) ? allowedTypes : [];

            await setDoc(doc(db, "vouchers", code), {
                code: code,
                discountPercent: percent,
                email: email ? email.trim() : "",
                used: false,
                allowedOrderTypes: allowedOrderTypes,
                expiryDate: expiryDate,
                createdAt: new Date()
            });

            return { success: true, message: `Created custom voucher ${code} (${percent}% OFF, Expiry: ${expiryDays ? expiryDays + ' days' : 'never'}, Allowed types: ${allowedOrderTypes.join(', ') || 'all'}) successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        try {
            const docRef = doc(db, "orders", orderId);
            await updateDoc(docRef, { status: newStatus });
            return { success: true, message: `Updated status of order ${orderId} to "${newStatus}" successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function deleteOrder(orderId) {
        try {
            await deleteDoc(doc(db, "orders", orderId));
            return { success: true, message: `Deleted order ${orderId} successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function getOrdersByStatus(status) {
        try {
            const qSnap = await getDocs(collection(db, "orders"));
            const list = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.status === status) {
                    list.push({
                        id: docSnap.id,
                        customerName: data.customerName,
                        totalPrice: data.totalPrice,
                        items: data.items ? data.items.map(i => `${i.name} (x${i.qty})`).join(', ') : '',
                        status: data.status,
                        createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toLocaleString() : new Date(data.createdAt).toLocaleString()) : 'N/A'
                    });
                }
            });
            return list;
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function changeCurrentAdminPassword(newPassword) {
        try {
            const { updatePassword } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
            const { auth } = await import("./firebase-config.js");
            const user = auth.currentUser;
            if (!user) return { error: "No admin user currently logged in." };
            await updatePassword(user, newPassword);
            return { success: true, message: "Changed your admin password successfully." };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateCurrentAdminEmail(newEmail) {
        try {
            const { updateEmail } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
            const { auth } = await import("./firebase-config.js");
            const user = auth.currentUser;
            if (!user) return { error: "No admin user currently logged in." };
            await updateEmail(user, newEmail);
            return { success: true, message: `Updated your email to ${newEmail} successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function updateCurrentAdminProfile(name) {
        try {
            const { updateProfile } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js");
            const { auth } = await import("./firebase-config.js");
            const user = auth.currentUser;
            if (!user) return { error: "No admin user currently logged in." };
            await updateProfile(user, { displayName: name });
            return { success: true, message: `Updated your display name to ${name} successfully.` };
        } catch (e) {
            console.error(e);
            return { error: e.message };
        }
    }

    async function webSearch(query) {
        try {
            return await callWorker('webSearch', { query });
        } catch (e) {
            console.error('[webSearch]', e);
            return { error: e.message };
        }
    }

    async function browseWebUrl(url) {
        try {
            return await callWorker('browseWebUrl', { url });
        } catch (e) {
            console.error('[browseWebUrl]', e);
            return { error: e.message };
        }
    }

    // ─── Firebase Admin Tool Implementations (via Cloudflare Worker proxy) ─────
    async function adminListAuthUsers() {
        try {
            return await callWorker('listAuthUsers');
        } catch (e) {
            console.error('[adminListAuthUsers]', e);
            return { error: e.message };
        }
    }

    async function adminDeleteAuthUser(uid) {
        try {
            // 1. Delete from Firebase Auth via Worker
            const result = await callWorker('deleteAuthUser', { uid });
            // 2. Also delete Firestore profile
            try { await deleteDoc(doc(db, 'users', uid)); } catch (_) {}
            // Refresh list
            if (typeof window.loadUsers === 'function') window.loadUsers();
            return { ...result, message: result.message + ' + đã xoá profile Firestore.' };
        } catch (e) {
            console.error('[adminDeleteAuthUser]', e);
            return { error: e.message };
        }
    }

    async function adminDisableUser(uid) {
        try {
            return await callWorker('disableUser', { uid });
        } catch (e) {
            console.error('[adminDisableUser]', e);
            return { error: e.message };
        }
    }

    async function adminEnableUser(uid) {
        try {
            return await callWorker('enableUser', { uid });
        } catch (e) {
            console.error('[adminEnableUser]', e);
            return { error: e.message };
        }
    }

    async function adminChangeUserPassword(uid, newPassword) {
        try {
            return await callWorker('changeUserPassword', { uid, newPassword });
        } catch (e) {
            console.error('[adminChangeUserPassword]', e);
            return { error: e.message };
        }
    }

    async function adminChangeUserEmail(uid, newEmail) {
        try {
            const result = await callWorker('changeUserEmail', { uid, newEmail });
            // Sync to Firestore
            try { await updateDoc(doc(db, 'users', uid), { email: newEmail }); } catch (_) {}
            return result;
        } catch (e) {
            console.error('[adminChangeUserEmail]', e);
            return { error: e.message };
        }
    }

    async function adminVerifyUserEmail(uid) {
        try {
            return await callWorker('verifyUserEmail', { uid });
        } catch (e) {
            console.error('[adminVerifyUserEmail]', e);
            return { error: e.message };
        }
    }

    async function adminSetCustomClaims(uid, claims) {
        try {
            return await callWorker('setCustomClaims', { uid, claims });
        } catch (e) {
            console.error('[adminSetCustomClaims]', e);
            return { error: e.message };
        }
    }

    async function adminGetUserInfo(uid, email) {
        try {
            return await callWorker('getUserInfo', { uid, email });
        } catch (e) {
            console.error('[adminGetUserInfo]', e);
            return { error: e.message };
        }
    }

    async function adminRevokeUserTokens(uid) {
        try {
            return await callWorker('revokeUserTokens', { uid });
        } catch (e) {
            console.error('[adminRevokeUserTokens]', e);
            return { error: e.message };
        }
    }

    async function adminUpdateDisplayName(uid, displayName) {
        try {
            const result = await callWorker('updateDisplayName', { uid, displayName });
            // Sync to Firestore
            try { await updateDoc(doc(db, 'users', uid), { name: displayName }); } catch (_) {}
            return result;
        } catch (e) {
            console.error('[adminUpdateDisplayName]', e);
            return { error: e.message };
        }
    }

    async function adminGenerateCustomToken(uid) {
        // Not supported via REST API without full Admin SDK - return guidance
        return { 
            success: false, 
            message: `Custom token generation cần Firebase Admin SDK (Blaze Plan). Hãy dùng Firebase Console nếu cần.`
        };
    }

    let toolCallCount = 0;

    // Agent Loop Handler
    async function handleAgentResponse(responseText) {
        const textClean = stripThinking(responseText);
        
        // Match all tool calls globally
        const regex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
        const matches = [...textClean.matchAll(regex)];

        if (matches.length > 0) {
            toolCallCount++;
            if (toolCallCount > 5) {
                removeLoadingBubble();
                appendBubble("Hệ thống: Phát hiện nguy cơ lặp gọi công cụ vô hạn. AI đã dừng lại để bảo vệ hạn ngạch API.", 'ai');
                return;
            }

            // Create status bubble for real-time sequential updates
            const progressBubble = appendBubble(`Hệ thống: Bắt đầu xử lý ${matches.length} yêu cầu dữ liệu/thay đổi...`, 'ai');
            
            const results = [];
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const toolCallStr = match[1].trim();
                let toolName = "unknown";
                
                try {
                    const payload = JSON.parse(toolCallStr);
                    const { tool, args } = payload;
                    toolName = tool;
                    
                    progressBubble.textContent = `Hệ thống: Đang thực hiện ${i + 1}/${matches.length} (${toolName})... (Thành công: ${successCount}, Thất bại: ${failCount})`;
                    
                    let result;
                    if (tool === 'getOrdersSoldToday') {
                        result = await getOrdersSoldToday();
                    } else if (tool === 'listAllFoodItems') {
                        result = await listAllFoodItems();
                    } else if (tool === 'setOptionChoicePrice') {
                        result = await setOptionChoicePrice(args.dishId, args.optionName, args.choiceLabel, args.newPrice);
                    } else if (tool === 'updateMenuPrice') {
                        result = await updateMenuPrice(args.dishId, args.newPrice);
                    } else if (tool === 'addMenuOptionGroup') {
                        result = await addMenuOptionGroup(
                            args.dishId,
                            args.optionNameVi || args.optionName,
                            args.optionNameEn || args.optionName,
                            args.optionNameFi || args.optionName,
                            args.optionType,
                            args.choices
                        );
                    } else if (tool === 'removeMenuOptionGroup') {
                        result = await removeMenuOptionGroup(args.dishId, args.optionName);
                    } else if (tool === 'addChoiceToOptionGroup') {
                        result = await addChoiceToOptionGroup(
                            args.dishId,
                            args.optionName,
                            args.choiceLabelVi || args.choiceLabel,
                            args.choiceLabelEn || args.choiceLabel,
                            args.choiceLabelFi || args.choiceLabel,
                            args.choicePrice
                        );
                    } else if (tool === 'removeChoiceFromOptionGroup') {
                        result = await removeChoiceFromOptionGroup(args.dishId, args.optionName, args.choiceLabel);
                    } else if (tool === 'updateMenuOptionGroup') {
                        result = await updateMenuOptionGroup(
                            args.dishId,
                            args.oldOptionName,
                            args.newOptionNameVi,
                            args.newOptionNameEn,
                            args.newOptionNameFi,
                            args.newOptionType
                        );
                    } else if (tool === 'updateChoiceInOptionGroup') {
                        result = await updateChoiceInOptionGroup(
                            args.dishId,
                            args.optionName,
                            args.oldChoiceLabel,
                            args.newChoiceLabelVi,
                            args.newChoiceLabelEn,
                            args.newChoiceLabelFi,
                            args.newChoicePrice
                        );
                    } else if (tool === 'updateMenuName') {
                        result = await updateMenuName(args.dishId, args.nameVi, args.nameEn, args.nameFi);
                    } else if (tool === 'updateMenuDescription') {
                        result = await updateMenuDescription(args.dishId, args.descriptionVi, args.descriptionEn, args.descriptionFi);
                    } else if (tool === 'updateMenuCategory') {
                        result = await updateMenuCategory(args.dishId, args.categoryVi || args.newCategoryId || args.categoryId, args.categoryEn, args.categoryFi);
                    } else if (tool === 'updateMenuAvailability') {
                        result = await updateMenuAvailability(args.dishId, args.isAvailable);
                    } else if (tool === 'uploadMenuImage') {
                        let finalImageUrl = args.imageUrl;
                        if (finalImageUrl && window.__uploadedImages && window.__uploadedImages[finalImageUrl]) {
                            finalImageUrl = window.__uploadedImages[finalImageUrl];
                        }
                        result = await uploadMenuImage(args.dishId, finalImageUrl);
                    } else if (tool === 'removeMenuImage') {
                        result = await removeMenuImage(args.dishId, args.imageUrl);
                    } else if (tool === 'updateMenuPreparationTime') {
                        result = await updateMenuPreparationTime(args.dishId, args.minutes);
                    } else if (tool === 'updateMenuNutritionInfo') {
                        result = await updateMenuNutritionInfo(args.dishId, args.calories, args.protein, args.fat, args.carbs);
                    } else if (tool === 'addMenuTag') {
                        result = await addMenuTag(args.dishId, args.tagLabelVi, args.tagLabelEn, args.tagLabelFi);
                    } else if (tool === 'removeMenuTag') {
                        result = await removeMenuTag(args.dishId, args.tagLabel);
                    } else if (tool === 'reorderMenuItems') {
                        result = await reorderMenuItems(args.orderedDishIds);
                    } else if (tool === 'duplicateMenuItem') {
                        result = await duplicateMenuItem(args.dishId, args.newDishId);
                    } else if (tool === 'deleteMenuItem') {
                        result = await deleteMenuItem(args.dishId);
                    } else if (tool === 'updateMenuCustomFields') {
                        result = await updateMenuCustomFields(args.dishId, args.customFields || args.customFieldsObject);
                    } else if (tool === 'listAllUsers') {
                        result = await listAllUsers();
                    } else if (tool === 'changeUserRole') {
                        result = await changeUserRole(args.uid, args.newRole);
                    } else if (tool === 'deleteUserAccount') {
                        result = await deleteUserAccount(args.uid);
                    } else if (tool === 'createUserAccount') {
                        result = await createUserAccount(args.email, args.password, args.name, args.role);
                    } else if (tool === 'sendPasswordReset') {
                        result = await sendPasswordReset(args.email);
                    } else if (tool === 'sendSpinsToUser') {
                        result = await sendSpinsToUser(args.uidOrEmail || args.uid, args.spinType, args.count);
                    } else if (tool === 'sendGlobalAnnouncement') {
                        let finalImageUrl = args.imageUrl;
                        if (finalImageUrl && window.__uploadedImages && window.__uploadedImages[finalImageUrl]) {
                            finalImageUrl = window.__uploadedImages[finalImageUrl];
                        }
                        result = await sendGlobalAnnouncement(args.title, args.text, finalImageUrl);
                    } else if (tool === 'createCustomVoucher') {
                        result = await createCustomVoucher(args.email, args.discountPercent, args.expiryDays, args.allowedTypes);
                    } else if (tool === 'updateOrderStatus') {
                        result = await updateOrderStatus(args.orderId, args.newStatus);
                    } else if (tool === 'deleteOrder') {
                        result = await deleteOrder(args.orderId);
                    } else if (tool === 'getOrdersByStatus') {
                        result = await getOrdersByStatus(args.status);
                    } else if (tool === 'changeCurrentAdminPassword') {
                        result = await changeCurrentAdminPassword(args.newPassword);
                    } else if (tool === 'updateCurrentAdminEmail') {
                        result = await updateCurrentAdminEmail(args.newEmail);
                    } else if (tool === 'updateCurrentAdminProfile') {
                        result = await updateCurrentAdminProfile(args.name);
                    } else if (tool === 'adminListAuthUsers') {
                        result = await adminListAuthUsers();
                    } else if (tool === 'adminDeleteAuthUser') {
                        result = await adminDeleteAuthUser(args.uid);
                    } else if (tool === 'adminDisableUser') {
                        result = await adminDisableUser(args.uid);
                    } else if (tool === 'adminEnableUser') {
                        result = await adminEnableUser(args.uid);
                    } else if (tool === 'adminChangeUserPassword') {
                        result = await adminChangeUserPassword(args.uid, args.newPassword);
                    } else if (tool === 'adminChangeUserEmail') {
                        result = await adminChangeUserEmail(args.uid, args.newEmail);
                    } else if (tool === 'adminVerifyUserEmail') {
                        result = await adminVerifyUserEmail(args.uid);
                    } else if (tool === 'adminSetCustomClaims') {
                        result = await adminSetCustomClaims(args.uid, args.claims);
                    } else if (tool === 'adminGetUserInfo') {
                        result = await adminGetUserInfo(args.uid, args.email);
                    } else if (tool === 'adminRevokeUserTokens') {
                        result = await adminRevokeUserTokens(args.uid);
                    } else if (tool === 'adminUpdateDisplayName') {
                        result = await adminUpdateDisplayName(args.uid, args.displayName);
                    } else if (tool === 'adminGenerateCustomToken') {
                        result = await adminGenerateCustomToken(args.uid);
                    } else if (tool === 'webSearch') {
                        result = await webSearch(args.query);
                    } else if (tool === 'browseWebUrl') {
                        result = await browseWebUrl(args.url);
                    } else if (tool === 'updateHomepageHero') {
                        let finalImageUrl = args.imageUrl;
                        if (finalImageUrl && window.__uploadedImages && window.__uploadedImages[finalImageUrl]) {
                            finalImageUrl = window.__uploadedImages[finalImageUrl];
                        }
                        result = await updateHomepageHero(finalImageUrl, args.titleVi, args.titleEn, args.titleFi, args.descVi, args.descEn, args.descFi);
                    } else if (tool === 'updateHomepageSignatures') {
                        result = await updateHomepageSignatures(args.dishIdArray);
                    } else if (tool === 'updateHomepageSignatureText') {
                        result = await updateHomepageSignatureText(args.titleVi, args.titleEn, args.titleFi, args.descVi, args.descEn, args.descFi);
                    } else if (tool === 'updateHomepageStory') {
                        let finalImageUrl = args.imageUrl;
                        if (finalImageUrl && window.__uploadedImages && window.__uploadedImages[finalImageUrl]) {
                            finalImageUrl = window.__uploadedImages[finalImageUrl];
                        }
                        result = await updateHomepageStory(finalImageUrl, args.labelVi, args.labelEn, args.labelFi, args.titleVi, args.titleEn, args.titleFi, args.p1Vi, args.p1En, args.p1Fi, args.p2Vi, args.p2En, args.p2Fi);
                    } else if (tool === 'updateHomepageCTA') {
                        result = await updateHomepageCTA(args.titleVi, args.titleEn, args.titleFi, args.descVi, args.descEn, args.descFi);
                    } else {
                        result = { error: `Tool "${tool}" không tồn tại. Các tools hợp lệ: getOrdersSoldToday, listAllFoodItems, setOptionChoicePrice, updateMenuPrice, createMenuItem, addMenuOptionGroup, removeMenuOptionGroup, addChoiceToOptionGroup, removeChoiceFromOptionGroup, updateMenuOptionGroup, updateChoiceInOptionGroup, updateMenuName, updateMenuDescription, updateMenuCategory, updateMenuAvailability, uploadMenuImage, removeMenuImage, updateMenuPreparationTime, updateMenuNutritionInfo, addMenuTag, removeMenuTag, reorderMenuItems, duplicateMenuItem, deleteMenuItem, updateMenuCustomFields, listAllUsers, changeUserRole, deleteUserAccount, createUserAccount, sendPasswordReset, sendSpinsToUser, sendGlobalAnnouncement, createCustomVoucher, updateOrderStatus, deleteOrder, getOrdersByStatus, changeCurrentAdminPassword, updateCurrentAdminEmail, updateCurrentAdminProfile, adminListAuthUsers, adminDeleteAuthUser, adminDisableUser, adminEnableUser, adminChangeUserPassword, adminChangeUserEmail, adminVerifyUserEmail, adminSetCustomClaims, adminGetUserInfo, adminRevokeUserTokens, adminUpdateDisplayName, adminGenerateCustomToken, webSearch, browseWebUrl, updateHomepageHero, updateHomepageSignatures, updateHomepageSignatureText, updateHomepageStory, updateHomepageCTA.` };
                    }
                    
                    if (result && typeof result === 'object' && result.hasOwnProperty('error')) {
                        results.push({ tool: toolName, success: false, error: result.error });
                        failCount++;
                    } else {
                        results.push({ tool: toolName, success: true, result });
                        successCount++;
                    }
                } catch (e) {
                    results.push({ tool: toolName, success: false, error: e.message });
                    failCount++;
                }
                
                // Add a small 40ms delay between updates to avoid rate limit spikes & allow DOM drawing
                await new Promise(r => setTimeout(r, 40));
            }

            // Final progress update
            progressBubble.textContent = `Hệ thống: Đã xử lý xong ${matches.length} yêu cầu. (Thành công: ${successCount}, Thất bại: ${failCount})`;

            // Feed all results back in a single feedback message
            const summaryHeader = `[TỔNG HỢP KẾT QUẢ THỰC THI]:\n- Tổng số yêu cầu: ${matches.length}\n- Thành công: ${successCount}\n- Thất bại: ${failCount}\n\n`;
            
            const feedbackContent = results.map((r, idx) => {
                return `[Kết quả Yêu cầu ${idx + 1} - ${r.tool}]:\n${JSON.stringify(r.success ? r.result : { error: r.error })}`;
            }).join('\n\n');

            chatMessages.push({
                role: 'user',
                content: `Dưới đây là kết quả thực thi các công cụ bạn yêu cầu:\n\n${summaryHeader}${feedbackContent}\n\nHãy tổng hợp các kết quả trên và trả lời trực tiếp cho người dùng bằng Tiếng Việt. Chú ý chỉ ra rõ những yêu cầu nào đã THÀNH CÔNG và những yêu cầu nào THẤT BẠI (kèm theo lỗi tương ứng). Nếu bạn cần thêm thông tin hoặc cần thực hiện thêm thao tác, hãy tiếp tục gọi tool. Nếu đã đủ thông tin thì trả lời ngay.`
            });

            // Call API once for the final response
            await fetchAiResponse();
        } else {
            // Remove loading and show final response
            removeLoadingBubble();
            appendBubble(textClean, 'ai');
        }
    }

    // Helper functions for UI bubble
    function appendBubble(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `admin-chat-bubble bubble-${sender}`;
        bubble.textContent = text;
        msgArea.appendChild(bubble);
        msgArea.scrollTop = msgArea.scrollHeight;
        return bubble;
    }

    function appendLoadingBubble() {
        const bubble = document.createElement('div');
        bubble.className = `admin-chat-bubble bubble-ai dots-loader`;
        bubble.id = 'admin-chat-loading-bubble';
        bubble.innerHTML = '<span></span><span></span><span></span>';
        msgArea.appendChild(bubble);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    function removeLoadingBubble() {
        const bubble = document.getElementById('admin-chat-loading-bubble');
        if (bubble) bubble.remove();
    }

    // Cerebras API Call Helper
    const CEREBRAS_KEYS = [
        apiKeys.cerebrasPrimary,
        apiKeys.cerebrasBackup
    ];

    async function callCerebras(payload, model = 'gpt-oss-120b') {
        let lastErr;
        for (const key of CEREBRAS_KEYS) {
            try {
                const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ model, messages: payload.messages })
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errText}`);
                }
                return await response.json();
            } catch (e) {
                console.warn(`[Cerebras] Key ${key.substring(0, 12)}... failed: ${e.message}`);
                lastErr = e;
            }
        }
        throw lastErr;
    }

    // API Call Trigger
    async function fetchAiResponse() {
        try {
            let data;
            try {
                console.log("[AI Chat] Calling Cerebras gpt-oss-120b...");
                data = await callCerebras({ messages: chatMessages }, 'gpt-oss-120b');
            } catch (primaryErr) {
                console.warn("[AI Chat] gpt-oss-120b failed. Falling back to Cerebras zai-glm-4.7...", primaryErr);
                try {
                    data = await callCerebras({ messages: chatMessages }, 'zai-glm-4.7');
                } catch (backupErr) {
                    console.warn("[AI Chat] zai-glm-4.7 also failed. Falling back to OpenRouter...", backupErr);
                    const payload = {
                        model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
                        messages: chatMessages
                    };
                    data = await callOpenRouterWithFallback(payload);
                }
            }

            const responseText = data.choices[0].message.content;
            
            // Push response to history
            chatMessages.push({ role: 'assistant', content: responseText });
            
            // Handle tool calling or plain response
            await handleAgentResponse(responseText);
        } catch (err) {
            removeLoadingBubble();
            appendBubble(`Lỗi kết nối AI: ${err.message}`, 'ai');
        }
    }

    // Sending user messages
    async function sendMessage() {
        const val = chatInput.value.trim();
        if (!val) return;
        
        chatInput.value = '';
        appendBubble(val, 'user');
        chatMessages.push({ role: 'user', content: val });
        
        toolCallCount = 0; // Reset tool count on new user message
        appendLoadingBubble();
        await fetchAiResponse();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
})();

