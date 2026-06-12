// â”€â”€â”€ FLOATING AI ADMIN CHAT (MESSENGER-STYLE) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { db, auth } from "../firebase-config.js";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { callWorker, listAllUsers, computeLoyaltyTier, callOpenRouterWithFallback, stripThinking, initApiKeys, getApiKeysCached } from "./utils.js";

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
        .admin-chat-bubble strong { color: #60a5fa; font-weight: 600; }
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
            <div class="p-4 bg-[#1e293b] border-b border-gray-800 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="font-bold text-white text-sm">Pho Viet Khang Assistant</span>
                </div>
                <button id="admin-chat-close" class="text-secondary hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3" id="admin-chat-messages">
                <div class="admin-chat-bubble bubble-ai">
                    Xin chÃ o! TÃ´i lÃ  Trá»£ lÃ½ AI cá»§a Phá»‘ Viá»‡t Khang. TÃ´i cÃ³ thá»ƒ há»— trá»£ báº¡n kiá»ƒm tra Ä‘Æ¡n hÃ ng hÃ´m nay hoáº·c cáº­p nháº­t giÃ¡ cáº£ cÃ¡c mÃ³n Äƒn trá»±c tiáº¿p. Báº¡n cáº§n giÃºp gÃ¬?
                </div>
            </div>
            <div class="p-3 border-t border-gray-800 bg-[#121824] flex gap-2 relative">
                <input type="file" id="admin-chat-file" accept="image/*,.doc,.docx,.xls,.xlsx,.csv" class="hidden">
                <button id="admin-chat-attach" class="bg-[#1e293b] hover:bg-gray-700 text-secondary hover:text-white p-2 rounded-xl border border-gray-700 transition-colors flex items-center justify-center" title="ÄÃ­nh kÃ¨m (áº¢nh, Word, Excel)">
                    <span class="material-symbols-outlined text-[18px]">attach_file</span>
                </button>
                <input type="text" id="admin-chat-input" placeholder="Há»i vá» Ä‘Æ¡n hÃ ng, chá»‰nh giÃ¡ sá»‘t..." class="flex-1 bg-[#0b0f19] border border-gray-700 rounded-xl text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
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

    const apiKeys = initApiKeys();

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

    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const attachIcon = attachBtn.querySelector('span');
        const originalIcon = attachIcon.textContent;
        attachIcon.textContent = 'hourglass_empty';
        attachIcon.classList.add('animate-spin');
        chatInput.placeholder = 'Äang xá»­ lÃ½ file...';
        chatInput.disabled = true;
        try {
            const ext = file.name.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 480, MAX_HEIGHT = 480;
                        let width = img.width, height = img.height;
                        if (width > height) {
                            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                        } else {
                            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                        }
                        canvas.width = width; canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
                        window.__uploadedImages = window.__uploadedImages || {};
                        const imgId = "ATTACHED_IMAGE_" + Date.now();
                        window.__uploadedImages[imgId] = dataUrl;
                        chatInput.value += (chatInput.value ? ' ' : '') + `[áº¢nh Ä‘Ã­nh kÃ¨m: ${imgId}] `;
                        attachIcon.classList.remove('animate-spin');
                        attachIcon.textContent = originalIcon;
                        chatInput.placeholder = 'Há»i vá» Ä‘Æ¡n hÃ ng, chá»‰nh giÃ¡ sá»‘t...';
                        chatInput.disabled = false;
                        chatInput.focus();
                        fileInput.value = '';
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
                return;
            } else if (ext === 'docx' || ext === 'doc') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                chatInput.value += (chatInput.value ? '\n' : '') + `[Ná»™i dung file Word ${file.name}:\n${result.value}]\n`;
            } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const csvStr = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                chatInput.value += (chatInput.value ? '\n' : '') + `[Ná»™i dung file Excel ${file.name}:\n${csvStr}]\n`;
            } else {
                alert('Äá»‹nh dáº¡ng file khÃ´ng Ä‘Æ°á»£c há»— trá»£!');
            }
        } catch (err) {
            console.error(err);
            alert('Lá»—i xá»­ lÃ½ file: ' + err.message);
        } finally {
            attachIcon.classList.remove('animate-spin');
            attachIcon.textContent = originalIcon;
            chatInput.placeholder = 'Há»i vá» Ä‘Æ¡n hÃ ng, chá»‰nh giÃ¡ sá»‘t...';
            chatInput.disabled = false;
            chatInput.focus();
            fileInput.value = '';
        }
    });

    toggleBtn.addEventListener('click', () => {
        if (chatWin.classList.contains('show')) {
            chatWin.classList.remove('show');
            setTimeout(() => chatWin.style.display = 'none', 250);
            chatIcon.textContent = 'chat';
        } else {
            chatWin.style.display = 'flex';
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

    const chatMessages = [{
        role: 'system',
        content: `You are a helpful Vietnamese restaurant AI Admin Assistant for Phá»Ÿ Viá»‡t Khang restaurant.
You have full access to Firebase tools that can manage orders, food menu, AND Firebase Auth user accounts with real admin privileges.
You MUST answer in Vietnamese.

IMPORTANT: Whenever you need data or need to make changes, you MUST call the appropriate tool(s). Do NOT make up data.
To call a tool, output a <tool_call> JSON block:
<tool_call>
{ "tool": "tool_name", "args": { "arg1": "value1" } }
</tool_call>

Rules:
- You CAN output multiple <tool_call> blocks in one turn.
- When outputting tool calls, output ONLY the <tool_call> blocks.
- After receiving tool results, formulate your final Vietnamese response.

TOOLS AVAILABLE:
- Orders: getOrdersSoldToday, getOrdersByStatus, updateOrderStatus, deleteOrder
- Menu: listAllFoodItems, updateMenuPrice, createMenuItem, setOptionChoicePrice, addMenuOptionGroup, removeMenuOptionGroup, addChoiceToOptionGroup, removeChoiceFromOptionGroup, updateMenuOptionGroup, updateChoiceInOptionGroup, updateMenuName, updateMenuDescription, updateMenuCategory, updateMenuAvailability, uploadMenuImage, removeMenuImage, updateMenuPreparationTime, updateMenuNutritionInfo, addMenuTag, removeMenuTag, reorderMenuItems, duplicateMenuItem, deleteMenuItem, updateMenuCustomFields
- Users: listAllUsers, getUserLoyalty, addLoyaltyProgressByOrderId, changeUserRole, createUserAccount, sendPasswordReset, sendSpinsToUser, createCustomVoucher, markVoucherUsed, removeVoucher, listAllVouchers
- Auth: adminListAuthUsers, adminDeleteAuthUser, adminDisableUser, adminEnableUser, adminChangeUserPassword, adminChangeUserEmail, adminVerifyUserEmail, adminSetCustomClaims, adminGetUserInfo, adminRevokeUserTokens, adminUpdateDisplayName, adminGenerateCustomToken
- Self: changeCurrentAdminPassword, updateCurrentAdminEmail, updateCurrentAdminProfile
- Homepage: updateHomepageHero, updateHomepageSignatures, updateHomepageSignatureText, updateHomepageStory, updateHomepageCTA, getWheelGuarantee, updateWheelGuarantee, updateHomepageReviews, updateReviewImageUrl
- Web: webSearch, browseWebUrl
- Messages: sendGlobalAnnouncement`
    }];

    // Tool Implementations
    async function getOrdersSoldToday() {
        try {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const qSnap = await getDocs(collection(db, "orders"));
            let count = 0, totalRevenue = 0;
            const list = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                let orderDate = null;
                if (data.createdAt && typeof data.createdAt.toDate === 'function') orderDate = data.createdAt.toDate();
                else if (data.createdAt) orderDate = new Date(data.createdAt);
                if (orderDate && orderDate >= today) {
                    count++; totalRevenue += data.totalPrice || 0;
                    list.push({ id: docSnap.id, customerName: data.customerName, totalPrice: data.totalPrice, items: data.items ? data.items.map(i => `${i.name} (x${i.qty})`).join(', ') : '', status: data.status, time: orderDate.toLocaleTimeString() });
                }
            });
            return { count, totalRevenue, orders: list };
        } catch (e) { return { error: e.message }; }
    }

    async function getOrdersByStatus(status) {
        try {
            const qSnap = await getDocs(collection(db, "orders"));
            const list = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.status === status) list.push({ id: docSnap.id, customerName: data.customerName, totalPrice: data.totalPrice, items: data.items ? data.items.map(i => `${i.name} (x${i.qty})`).join(', ') : '', status: data.status, createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toLocaleString() : new Date(data.createdAt).toLocaleString()) : 'N/A' });
            });
            return list;
        } catch (e) { return { error: e.message }; }
    }

    async function updateOrderStatus(orderId, newStatus) {
        try { await updateDoc(doc(db, "orders", orderId), { status: newStatus }); return { success: true, message: `Updated status of order ${orderId} to "${newStatus}".` }; }
        catch (e) { return { error: e.message }; }
    }

    async function deleteOrder(orderId) {
        try { await deleteDoc(doc(db, "orders", orderId)); return { success: true, message: `Deleted order ${orderId}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function listAllFoodItems() {
        try {
            const qSnap = await getDocs(collection(db, "menu"));
            const items = [];
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                items.push({ id: docSnap.id, nameVi: data.nameVi || '', nameEn: data.nameEn || '', nameFi: data.nameFi || '', category: data.category || '', categoryVi: data.categoryVi || '', categoryEn: data.categoryEn || '', categoryFi: data.categoryFi || '', price: data.price, options: data.options || [] });
            });
            return items;
        } catch (e) { return { error: e.message }; }
    }

    async function updateMenuPrice(dishId, newPrice) {
        try { await updateDoc(doc(db, "menu", dishId), { price: parseFloat(newPrice) }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t giÃ¡ mÃ³n thÃ nh cÃ´ng.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuName(dishId, nameVi, nameEn, nameFi) {
        try { const u = {}; if (nameVi !== undefined) u.nameVi = nameVi; if (nameEn !== undefined) u.nameEn = nameEn; if (nameFi !== undefined) u.nameFi = nameFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t tÃªn mÃ³n.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuDescription(dishId, descVi, descEn, descFi) {
        try { const u = {}; if (descVi !== undefined) u.descVi = descVi; if (descEn !== undefined) u.descEn = descEn; if (descFi !== undefined) u.descFi = descFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t mÃ´ táº£.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuCategory(dishId, categoryVi, categoryEn, categoryFi) {
        try { const u = {}; if (categoryVi !== undefined) { u.category = categoryVi; u.categoryVi = categoryVi; } if (categoryEn !== undefined) u.categoryEn = categoryEn; if (categoryFi !== undefined) u.categoryFi = categoryFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t danh má»¥c.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuAvailability(dishId, isAvailable) {
        try { await updateDoc(doc(db, "menu", dishId), { isAvailable: !!isAvailable }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function uploadMenuImage(dishId, imageUrl) {
        try { await updateDoc(doc(db, "menu", dishId), { image: imageUrl }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t áº£nh.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuImage(dishId) {
        try { await updateDoc(doc(db, "menu", dishId), { image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500' }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ xoÃ¡ áº£nh.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuPreparationTime(dishId, minutes) {
        try { await updateDoc(doc(db, "menu", dishId), { preparationTime: parseInt(minutes) || 0 }); return { success: true, message: `ÄÃ£ cáº­p nháº­t thá»i gian chuáº©n bá»‹.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuNutritionInfo(dishId, calories, protein, fat, carbs) {
        try { await updateDoc(doc(db, "menu", dishId), { nutrition: { calories: parseFloat(calories) || 0, protein: parseFloat(protein) || 0, fat: parseFloat(fat) || 0, carbs: parseFloat(carbs) || 0 } }); return { success: true, message: `ÄÃ£ cáº­p nháº­t dinh dÆ°á»¡ng.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function addMenuTag(dishId, tagLabelVi, tagLabelEn, tagLabelFi) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; const tags = snap.data().tags || []; const lVi = tagLabelVi || '', lEn = tagLabelEn || lVi, lFi = tagLabelFi || lVi; if (!tags.some(t => (t.labelVi||'').toLowerCase() === lVi.toLowerCase())) tags.push({ labelVi: lVi, labelEn: lEn, labelFi: lFi }); await updateDoc(doc(db, "menu", dishId), { tags }); return { success: true, message: `ÄÃ£ thÃªm tag "${lVi}".` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuTag(dishId, tagLabel) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; const tags = snap.data().tags || []; const newTags = tags.filter(t => (t.labelVi||'').toLowerCase() !== tagLabel.toLowerCase() && (t.labelEn||'').toLowerCase() !== tagLabel.toLowerCase() && (t.labelFi||'').toLowerCase() !== tagLabel.toLowerCase()); if (tags.length === newTags.length) return { error: `KhÃ´ng tÃ¬m tháº¥y tag "${tagLabel}".` }; await updateDoc(doc(db, "menu", dishId), { tags: newTags }); return { success: true, message: `ÄÃ£ xoÃ¡ tag.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function reorderMenuItems(orderedDishIds) {
        try { for (let i = 0; i < orderedDishIds.length; i++) await updateDoc(doc(db, "menu", orderedDishIds[i]), { sortOrder: i }); return { success: true, message: "ÄÃ£ sáº¯p xáº¿p láº¡i." }; }
        catch (e) { return { error: e.message }; }
    }

    async function duplicateMenuItem(dishId) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; const newRef = await addDoc(collection(db, "menu"), { ...snap.data(), nameVi: (snap.data().nameVi || "") + " (Báº£n sao)", createdAt: new Date() }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ nhÃ¢n báº£n vá»›i ID: ${newRef.id}` }; }
        catch (e) { return { error: e.message }; }
    }

    async function deleteMenuItem(dishId) {
        try { await deleteDoc(doc(db, "menu", dishId)); if (window.loadFood) window.loadFood(); if (window.loadCategories) window.loadCategories(); return { success: true, message: `ÄÃ£ xoÃ¡ mÃ³n.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuCustomFields(dishId, customFields) {
        try { await updateDoc(doc(db, "menu", dishId), customFields); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t trÆ°á»ng tuá»³ chá»‰nh.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function setOptionChoicePrice(dishId, optionName, choiceLabel, newPrice) {
        try {
            let targetDoc = null;
            const qSnap = await getDocs(collection(db, "menu"));
            qSnap.forEach(d => { if (d.id === dishId) targetDoc = d.data(); });
            if (!targetDoc) return { error: "Dish not found" };
            const options = targetDoc.options ? targetDoc.options.map(opt => {
                const matchesOpt = [opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase());
                if (matchesOpt) opt.choices = opt.choices.map(c => { const matchesChoice = [c.label, c.labelVi, c.labelEn, c.labelFi].some(l => (l||'').toLowerCase() === choiceLabel.toLowerCase()); if (matchesChoice) c.price = parseFloat(newPrice); return c; });
                return opt;
            }) : [];
            await updateDoc(doc(db, "menu", dishId), { options });
            if (window.loadFood) window.loadFood();
            return { success: true, message: `ÄÃ£ cáº­p nháº­t giÃ¡ ${choiceLabel} thÃ nh ${newPrice}â‚¬.` };
        } catch (e) { return { error: e.message }; }
    }

    async function addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; const options = snap.data().options || []; options.push({ name: optionNameEn || optionNameVi, nameVi: optionNameVi, nameEn: optionNameEn || optionNameVi, nameFi: optionNameFi || optionNameVi, type: optionType || 'toggle', choices: (choices||[]).map(c => ({ label: c.labelEn || c.labelVi, labelVi: c.labelVi, labelEn: c.labelEn || c.labelVi, labelFi: c.labelFi || c.labelVi, price: parseFloat(c.price)||0 })) }); await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ thÃªm nhÃ³m option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuOptionGroup(dishId, optionName) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; const options = (snap.data().options || []).filter(opt => ![opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())); await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ xoÃ¡ nhÃ³m option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choicePrice) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { opt.choices.push({ label: choiceLabelEn || choiceLabelVi, labelVi: choiceLabelVi, labelEn: choiceLabelEn || choiceLabelVi, labelFi: choiceLabelFi || choiceLabelVi, price: parseFloat(choicePrice)||0 }); updated = true; } return opt; }); if (!updated) return { error: "KhÃ´ng tÃ¬m tháº¥y nhÃ³m option." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ thÃªm lá»±a chá»n.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeChoiceFromOptionGroup(dishId, optionName, choiceLabel) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { const origLen = opt.choices.length; opt.choices = opt.choices.filter(c => ![c.label, c.labelVi, c.labelEn, c.labelFi].some(l => (l||'').toLowerCase() === choiceLabel.toLowerCase())); if (opt.choices.length < origLen) updated = true; } return opt; }); if (!updated) return { error: "KhÃ´ng tÃ¬m tháº¥y." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ xoÃ¡ lá»±a chá»n.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionType) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === oldOptionName.toLowerCase())) { if (newOptionNameVi) opt.nameVi = newOptionNameVi; if (newOptionNameEn) { opt.nameEn = newOptionNameEn; opt.name = newOptionNameEn; } if (newOptionNameFi) opt.nameFi = newOptionNameFi; if (newOptionType) opt.type = newOptionType; updated = true; } return opt; }); if (!updated) return { error: "KhÃ´ng tÃ¬m tháº¥y." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t nhÃ³m option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateChoiceInOptionGroup(dishId, optionName, oldChoiceLabel, newChoiceLabelVi, newChoiceLabelEn, newChoiceLabelFi, newChoicePrice) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y mÃ³n." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { opt.choices = opt.choices.map(c => { const matches = [c.label, c.labelVi, c.labelEn, c.labelFi].some(l => (l||'').toLowerCase() === oldChoiceLabel.toLowerCase()); if (matches) { if (newChoiceLabelVi) c.labelVi = newChoiceLabelVi; if (newChoiceLabelEn) { c.labelEn = newChoiceLabelEn; c.label = newChoiceLabelEn; } if (newChoiceLabelFi) c.labelFi = newChoiceLabelFi; if (newChoicePrice !== undefined && newChoicePrice !== null) c.price = parseFloat(newChoicePrice); updated = true; } return c; }); } return opt; }); if (!updated) return { error: "KhÃ´ng tÃ¬m tháº¥y." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ cáº­p nháº­t lá»±a chá»n.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function createMenuItem(nameVi, price, categoryVi, descriptionVi, imageUrl) {
        try { const ref = await addDoc(collection(db, "menu"), { nameVi: nameVi||"", nameEn: "", nameFi: "", price: parseFloat(price)||0, categoryVi: categoryVi||"", categoryEn: "", categoryFi: "", descVi: descriptionVi||"", descEn: "", descFi: "", image: imageUrl||"", isAvailable: true, preparationTime: 15, nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 }, tags: [] }); if (window.loadFood) window.loadFood(); return { success: true, message: `ÄÃ£ táº¡o mÃ³n vá»›i ID: ${ref.id}` }; }
        catch (e) { return { error: e.message }; }
    }

    async function changeUserRole(uid, newRole) {
        try { await updateDoc(doc(db, "users", uid), { role: newRole }); if (window.loadUsers) window.loadUsers(); return { success: true, message: `ÄÃ£ Ä‘á»•i role user ${uid} thÃ nh ${newRole}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function getUserLoyalty(uid) {
        try { const snap = await getDoc(doc(db, "users", uid)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y user." }; const totalSpent = snap.data().totalSpent||0; const tier = computeLoyaltyTier(totalSpent); return { uid, totalSpent, tier: tier.key, tierLabelVi: tier.labelVi, discountPercent: tier.discountPercent }; }
        catch (e) { return { error: e.message }; }
    }

    async function addLoyaltyProgressByOrderId(orderId) {
        try { const snap = await getDoc(doc(db, "orders", orderId)); if (!snap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n." }; const order = snap.data(); const userId = order.userId; if (!userId) return { error: "KhÃ´ng cÃ³ userId." }; const EUR_RATE = 25000; const totalEur = +((order.totalPrice||0) / EUR_RATE).toFixed(2); await updateDoc(doc(db, "users", userId), { ...(order.totalSpent ? { totalSpent: Number(((order.totalSpent + totalEur).toFixed(2))) } : { totalSpent: totalEur }) }); return { success: true, message: `ÄÃ£ cá»™ng ${totalEur} EUR loyalty.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function sendPasswordReset(email) {
        try { await callWorker('sendPasswordReset', { email }); return { success: true, message: `ÄÃ£ gá»­i email reset password tá»›i ${email}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function sendSpinsToUser(uidOrEmail, spinType, count) {
        try { const type = (spinType||'deu').toLowerCase(); if (!['deu','xin','vip'].includes(type)) return { error: "Loáº¡i khÃ´ng há»£p lá»‡." }; const qty = parseInt(count,10)||1; let uid = uidOrEmail; if (uidOrEmail.includes('@')) { const q = query(collection(db, "users"), where("email", "==", uidOrEmail.trim())); const snap = await getDocs(q); if (snap.empty) return { error: `KhÃ´ng tÃ¬m tháº¥y user.` }; uid = snap.docs[0].id; } const userSnap = await getDoc(doc(db, "users", uid)); if (!userSnap.exists()) return { error: "KhÃ´ng tÃ¬m tháº¥y user." }; const data = userSnap.data(); const spins = data.spins || { deu: 0, xin: 0, vip: 0 }; spins[type] = (spins[type]||0)+qty; await updateDoc(doc(db, "users", uid), { spins }); return { success: true, message: `ÄÃ£ táº·ng ${qty} lÆ°á»£t quay ${type}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function createCustomVoucher(email, discountPercent, expiryDays, allowedTypes) {
        try { const code = `PROMO${discountPercent}-${Math.random().toString(36).substring(2,6).toUpperCase()}`; let expiryDate = null; if (expiryDays && expiryDays !== 'never') { expiryDate = new Date(); expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays)); } await setDoc(doc(db, "vouchers", code), { code, discountPercent: parseInt(discountPercent)||10, email: (email||'').trim(), used: false, allowedOrderTypes: allowedTypes||[], expiryDate, createdAt: new Date() }); return { success: true, message: `ÄÃ£ táº¡o voucher ${code} (${discountPercent}% OFF).` }; }
        catch (e) { return { error: e.message }; }
    }

    async function markVoucherUsed(voucherCode) {
        try { const code = (voucherCode||'').trim().toUpperCase(); if (!code) return { error: 'Required.' }; const snap = await getDoc(doc(db, "vouchers", code)); if (!snap.exists()) return { error: `KhÃ´ng tÃ¬m tháº¥y voucher.` }; await updateDoc(doc(db, "vouchers", code), { used: true }); return { success: true, message: `ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘Ã£ dÃ¹ng.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeVoucher(voucherCode) {
        try { const code = (voucherCode||'').trim().toUpperCase(); if (!code) return { error: 'Required.' }; const snap = await getDoc(doc(db, "vouchers", code)); if (!snap.exists()) return { error: `KhÃ´ng tÃ¬m tháº¥y.` }; await deleteDoc(doc(db, "vouchers", code)); return { success: true, message: `ÄÃ£ xoÃ¡ voucher.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function listAllVouchers() {
        try { const qSnap = await getDocs(collection(db, "vouchers")); const vouchers = []; qSnap.forEach(d => { const data = d.data(); vouchers.push({ code: d.id, discountPercent: data.discountPercent, email: data.email||'', used: data.used||false, expiryDate: data.expiryDate ? data.expiryDate.toDate().toISOString() : null, allowedOrderTypes: data.allowedOrderTypes||[] }); }); return vouchers; }
        catch (e) { return { error: e.message }; }
    }

    async function sendGlobalAnnouncement(title, text, imageUrl) {
        try { await addDoc(collection(db, "messages"), { title: title||"", text: text||"", imageUrl: imageUrl||null, voucherCode: null, giftSpins: null, recipientId: 'all', readBy: [], createdAt: new Date() }); return { success: true, message: "ÄÃ£ gá»­i thÃ´ng bÃ¡o tá»›i táº¥t cáº£ user." }; }
        catch (e) { return { error: e.message }; }
    }

    async function createUserAccount(email, password, name, role) {
        try { return await callWorker('createUser', { email, password, name, role }); }
        catch (e) { return { error: e.message }; }
    }

    async function changeCurrentAdminPassword(newPassword) { return await callWorker('changeMyPassword', { newPassword }); }
    async function updateCurrentAdminEmail(newEmail) { return await callWorker('changeMyEmail', { newEmail }); }
    async function updateCurrentAdminProfile(name) { return await callWorker('changeMyName', { name }); }

    // Auth admin tools via worker
    async function adminListAuthUsers() { try { return await callWorker('listAuthUsers'); } catch (e) { return { error: e.message }; } }
    async function adminDeleteAuthUser(uid) { try { await callWorker('deleteAuthUser', { uid }); try { await deleteDoc(doc(db, 'users', uid)); } catch(_) {} if (window.loadUsers) window.loadUsers(); return { success: true, message: `ÄÃ£ xoÃ¡ user.` }; } catch (e) { return { error: e.message }; } }
    async function adminDisableUser(uid) { try { return await callWorker('disableUser', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminEnableUser(uid) { try { return await callWorker('enableUser', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminChangeUserPassword(uid, newPassword) { try { return await callWorker('changeUserPassword', { uid, newPassword }); } catch (e) { return { error: e.message }; } }
    async function adminChangeUserEmail(uid, newEmail) { try { const r = await callWorker('changeUserEmail', { uid, newEmail }); try { await updateDoc(doc(db, 'users', uid), { email: newEmail }); } catch(_) {} return r; } catch (e) { return { error: e.message }; } }
    async function adminVerifyUserEmail(uid) { try { return await callWorker('verifyUserEmail', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminSetCustomClaims(uid, claims) { try { return await callWorker('setCustomClaims', { uid, claims }); } catch (e) { return { error: e.message }; } }
    async function adminGetUserInfo(uid, email) { try { return await callWorker('getUserInfo', { uid, email }); } catch (e) { return { error: e.message }; } }
    async function adminRevokeUserTokens(uid) { try { return await callWorker('revokeUserTokens', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminUpdateDisplayName(uid, displayName) { try { const r = await callWorker('updateDisplayName', { uid, displayName }); try { await updateDoc(doc(db, 'users', uid), { name: displayName }); } catch(_) {} return r; } catch (e) { return { error: e.message }; } }
    async function adminGenerateCustomToken(uid) { return { success: false, message: "Cáº§n Firebase Admin SDK (Blaze Plan)." }; }

    // Homepage tools
    async function updateHomepageHero(imageUrl, titleVi, descVi) {
        try { await setDoc(doc(db, "config", "homepage"), { heroBgUrl: imageUrl||null, heroTitleVi: titleVi||null, heroDescVi: descVi||null }, { merge: true }); return { success: true, message: "Hero updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageSignatures(dishIdArray) {
        if (!Array.isArray(dishIdArray)) return { error: "dishIdArray must be array" };
        try { await setDoc(doc(db, "config", "homepage"), { signatureDishIds: dishIdArray }, { merge: true }); return { success: true, message: "Signatures updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageSignatureText(titleVi, descVi) {
        try { await setDoc(doc(db, "config", "homepage"), { signatureTitleVi: titleVi||null, signatureDescVi: descVi||null }, { merge: true }); return { success: true, message: "Signature text updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageStory(imageUrl, labelVi, titleVi, p1Vi, p2Vi) {
        try { await setDoc(doc(db, "config", "homepage"), { storyImg: imageUrl||null, storyLabelVi: labelVi||null, storyTitleVi: titleVi||null, storyP1Vi: p1Vi||null, storyP2Vi: p2Vi||null }, { merge: true }); return { success: true, message: "Story updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageCTA(titleVi, descVi) {
        try { await setDoc(doc(db, "config", "homepage"), { ctaTitleVi: titleVi||null, ctaDescVi: descVi||null }, { merge: true }); return { success: true, message: "CTA updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function getWheelGuarantee() {
        try { const snap = await getDoc(doc(db, "config", "luckyWheel")); const g = snap.exists() ? (snap.data().guarantee||{}) : {}; return { totalSpins: g.totalSpins??0, next20: g.next20??20, next50: g.next50??50, next100: g.next100??100 }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateWheelGuarantee(next20, next50, next100) {
        try { const u = {}; if (typeof next20 === "number") u.next20 = next20; if (typeof next50 === "number") u.next50 = next50; if (typeof next100 === "number") u.next100 = next100; await setDoc(doc(db, "config", "luckyWheel"), { guarantee: u }, { merge: true }); return { success: true, message: "Wheel guarantee updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageReviews(reviews) {
        try { await setDoc(doc(db, "config", "homepage"), { customReviews: reviews }, { merge: true }); return { success: true, message: "Reviews updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateReviewImageUrl(index, imageUrl) {
        try { const snap = await getDoc(doc(db, "config", "homepage")); const reviews = snap.exists() ? (snap.data().customReviews||[]) : []; if (index < 0 || index >= reviews.length) return { error: `Index ${index} khÃ´ng há»£p lá»‡.` }; reviews[index] = { ...reviews[index], avatar: imageUrl||reviews[index].avatar }; await setDoc(doc(db, "config", "homepage"), { customReviews: reviews }, { merge: true }); return { success: true, message: `ÄÃ£ cáº­p nháº­t áº£nh review.` }; }
        catch (e) { return { error: e.message }; }
    }
    async function webSearch(query) { try { return await callWorker('webSearch', { query }); } catch (e) { return { error: e.message }; } }
    async function browseWebUrl(url) { try { return await callWorker('browseWebUrl', { url }); } catch (e) { return { error: e.message }; } }

    const toolMap = {
        getOrdersSoldToday, getOrdersByStatus, updateOrderStatus, deleteOrder,
        listAllFoodItems, updateMenuPrice, setOptionChoicePrice, addMenuOptionGroup,
        removeMenuOptionGroup, addChoiceToOptionGroup, removeChoiceFromOptionGroup,
        updateMenuOptionGroup, updateChoiceInOptionGroup, updateMenuName, updateMenuDescription,
        updateMenuCategory, updateMenuAvailability, uploadMenuImage, removeMenuImage,
        updateMenuPreparationTime, updateMenuNutritionInfo, addMenuTag, removeMenuTag,
        reorderMenuItems, duplicateMenuItem, deleteMenuItem, updateMenuCustomFields,
        createMenuItem, listAllUsers: () => listAllUsers(),
        changeUserRole, getUserLoyalty, addLoyaltyProgressByOrderId, createUserAccount,
        sendPasswordReset, sendSpinsToUser, createCustomVoucher, markVoucherUsed, removeVoucher,
        listAllVouchers, sendGlobalAnnouncement, changeCurrentAdminPassword, updateCurrentAdminEmail,
        updateCurrentAdminProfile, adminListAuthUsers, adminDeleteAuthUser, adminDisableUser,
        adminEnableUser, adminChangeUserPassword, adminChangeUserEmail, adminVerifyUserEmail,
        adminSetCustomClaims, adminGetUserInfo, adminRevokeUserTokens, adminUpdateDisplayName,
        adminGenerateCustomToken, webSearch, browseWebUrl,
        updateHomepageHero, updateHomepageSignatures, updateHomepageSignatureText,
        updateHomepageStory, updateHomepageCTA, getWheelGuarantee, updateWheelGuarantee,
        updateHomepageReviews, updateReviewImageUrl
    };

    const KNOWN_TOOLS = new Set(Object.keys(toolMap));

    function tryParseToolJson(str) { try { const o = JSON.parse(str); if (o && o.tool && typeof o.tool === 'string') return o; } catch(e) {} return null; }

    function findJsonObjects(text) {
        const results = [];
        for (let i = 0; i < text.length; i++) {
            if (text[i] === '{') {
                let depth = 0, inString = false, escape = false;
                for (let j = i; j < text.length; j++) {
                    const ch = text[j];
                    if (escape) { escape = false; continue; }
                    if (ch === '\\') { escape = true; continue; }
                    if (ch === '"') { inString = !inString; continue; }
                    if (inString) continue;
                    if (ch === '{') depth++;
                    if (ch === '}') { depth--; if (depth === 0) { const p = tryParseToolJson(text.substring(i, j+1)); if (p) results.push(p); break; } }
                }
            }
        }
        return results;
    }

    function extractToolCalls(text) {
        const results = [];
        const tagRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
        let m;
        while ((m = tagRegex.exec(text)) !== null) {
            const inner = m[1].trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
            const p = tryParseToolJson(inner);
            if (p) results.push(p);
        }
        if (results.length > 0) return results;
        const cbRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
        while ((m = cbRegex.exec(text)) !== null) { const p = tryParseToolJson(m[1].trim()); if (p) results.push(p); }
        if (results.length > 0) return results;
        const bare = findJsonObjects(text);
        for (const o of bare) { if (KNOWN_TOOLS.has(o.tool)) results.push(o); }
        if (results.length > 0) return results;
        for (const o of bare) { if (o.tool) results.push(o); }
        return results;
    }

    let toolCallCount = 0;

    async function handleAgentResponse(responseText) {
        const textClean = stripThinking(responseText);
        const toolCalls = extractToolCalls(textClean);

        if (toolCalls.length > 0) {
            toolCallCount++;
            if (toolCallCount > 5) {
                removeLoadingBubble();
                appendBubble("Há»‡ thá»‘ng: PhÃ¡t hiá»‡n nguy cÆ¡ láº·p gá»i cÃ´ng cá»¥ vÃ´ háº¡n. AI Ä‘Ã£ dá»«ng láº¡i.", 'ai');
                return;
            }
            const progressBubbleEl = msgArea.lastElementChild;
            const results = [];
            let successCount = 0, failCount = 0;

            for (let i = 0; i < toolCalls.length; i++) {
                const payload = toolCalls[i];
                const tool = payload.tool;
                const args = payload.args || {};
                if (progressBubbleEl && msgArea.contains(progressBubbleEl) && progressBubbleEl.classList.contains('admin-chat-bubble')) {
                    progressBubbleEl.textContent = `Há»‡ thá»‘ng: Äang thá»±c hiá»‡n ${i+1}/${toolCalls.length} (${tool})... (OK: ${successCount}, Lá»—i: ${failCount})`;
                }
                let result;
                try {
                    const fn = toolMap[tool];
                    if (!fn) { result = { error: `Tool "${tool}" khÃ´ng tá»“n táº¡i.` }; }
                    else {
                        let imgFixedArgs = { ...args };
                        if (imgFixedArgs.imageUrl && window.__uploadedImages && window.__uploadedImages[imgFixedArgs.imageUrl]) {
                            imgFixedArgs.imageUrl = window.__uploadedImages[imgFixedArgs.imageUrl];
                        }
                        result = await fn(...Object.values(imgFixedArgs));
                    }
                } catch (err) { result = { error: err.message }; }
                if (result && typeof result === 'object' && result.error) { results.push({ tool, success: false, error: result.error }); failCount++; }
                else { results.push({ tool, success: true, result }); successCount++; }
            }

            const summaryHeader = `[Káº¾T QUáº¢ THá»°C THI]:\n- Tá»•ng: ${toolCalls.length}\n- ThÃ nh cÃ´ng: ${successCount}\n- Tháº¥t báº¡i: ${failCount}\n\n`;
            const feedbackContent = results.map((r, idx) => `[KQ ${idx+1} - ${r.tool}]:\n${r.success ? JSON.stringify(r.result) : r.error}`).join('\n\n');
            chatMessages.push({ role: 'user', content: `Káº¿t quáº£ thá»±c thi:\n\n${summaryHeader}${feedbackContent}\n\nHÃ£y tá»•ng há»£p cho user báº±ng Tiáº¿ng Viá»‡t.` });
            await fetchAiResponse();
        } else {
            removeLoadingBubble();
            appendBubble(textClean, 'ai');
        }
    }

    function renderMarkdown(text) {
        if (!text) return '';
        return text.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    }

    function appendBubble(text, sender) {
        const bubble = document.createElement('div');
        bubble.className = `admin-chat-bubble bubble-${sender}`;
        bubble.innerHTML = sender === 'ai' ? renderMarkdown(text) : text;
        msgArea.appendChild(bubble);
        msgArea.scrollTop = msgArea.scrollHeight;
        return bubble;
    }

    function appendLoadingBubble() {
        const b = document.createElement('div');
        b.className = 'admin-chat-bubble bubble-ai dots-loader';
        b.id = 'admin-chat-loading-bubble';
        b.innerHTML = '<span></span><span></span><span></span>';
        msgArea.appendChild(b);
        msgArea.scrollTop = msgArea.scrollHeight;
    }

    function removeLoadingBubble() {
        const b = document.getElementById('admin-chat-loading-bubble');
        if (b) b.remove();
    }

    async function fetchAiResponse() {
        try {
            let data;
            try {
                const keys = getApiKeysCached();
                const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${keys.cerebrasPrimary}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'gpt-oss-120b', messages: chatMessages })
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                data = await response.json();
            } catch (primaryErr) {
                try {
                    const keys = getApiKeysCached();
                    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${keys.cerebrasBackup}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'zai-glm-4.7', messages: chatMessages })
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    data = await response.json();
                } catch (backupErr) {
                    const payload = { model: 'nex-agi/nex-n2-pro:free', messages: chatMessages };
                    data = await callOpenRouterWithFallback(payload);
                }
            }
            const responseText = data.choices[0].message.content;
            chatMessages.push({ role: 'assistant', content: responseText });
            await handleAgentResponse(responseText);
        } catch (err) {
            removeLoadingBubble();
            appendBubble(`Lá»—i káº¿t ná»‘i AI: ${err.message}`, 'ai');
        }
    }

    async function sendMessage() {
        const val = chatInput.value.trim();
        if (!val) return;
        chatInput.value = '';
        appendBubble(val, 'user');
        chatMessages.push({ role: 'user', content: val });
        toolCallCount = 0;
        appendLoadingBubble();
        await fetchAiResponse();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
})();
