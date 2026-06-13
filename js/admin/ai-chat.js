// ─── FLOATING AI ADMIN CHAT (MESSENGER-STYLE) ───────────────────────────────
import { db, auth } from "../firebase-config.js";
import { collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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
        .attachment-preview-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background-color: #1e293b;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 11px;
            color: #e5e7eb;
            position: relative;
        }
        .attachment-preview-item img {
            width: 20px;
            height: 20px;
            object-fit: cover;
            border-radius: 4px;
        }
        .attachment-preview-item .remove-btn {
            cursor: pointer;
            color: #ef4444;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: 4px;
            font-size: 14px;
            line-height: 1;
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
                    Xin chào! Tôi là Trợ lý AI của Phở Việt Khang. Tôi có thể hỗ trợ bạn kiểm tra đơn hàng hôm nay hoặc cập nhật giá cả các món ăn trực tiếp. Bạn cần giúp gì?
                </div>
            </div>
            <div id="admin-chat-attachments-preview" class="p-2 bg-[#121824] border-t border-gray-800 flex flex-wrap gap-2 max-h-[80px] overflow-y-auto hidden"></div>
            <div class="p-3 border-t border-gray-800 bg-[#121824] flex gap-2 relative">
                <input type="file" id="admin-chat-file" accept="image/*,.doc,.docx,.xls,.xlsx,.csv" class="hidden" multiple>
                <button id="admin-chat-attach" class="bg-[#1e293b] hover:bg-gray-700 text-secondary hover:text-white p-2 rounded-xl border border-gray-700 transition-colors flex items-center justify-center" title="Đính kèm (Ảnh, Word, Excel)">
                    <span class="material-symbols-outlined text-[18px]">attach_file</span>
                </button>
                <input type="text" id="admin-chat-input" placeholder="Hỏi về đơn hàng, chỉnh giá..." class="flex-1 bg-[#0b0f19] border border-gray-700 rounded-xl text-white px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
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
    const attachmentsPreview = document.getElementById('admin-chat-attachments-preview');

    window.__currentAttachments = [];

    function renderAttachmentsPreview() {
        if (!attachmentsPreview) return;
        if (window.__currentAttachments.length === 0) {
            attachmentsPreview.classList.add('hidden');
            attachmentsPreview.innerHTML = '';
            return;
        }
        attachmentsPreview.classList.remove('hidden');
        attachmentsPreview.innerHTML = window.__currentAttachments.map((att, idx) => {
            const isImg = att.type === 'image';
            const icon = isImg ? `<img src="${att.content}" alt="thumbnail">` : `<span class="material-symbols-outlined text-[16px] text-blue-400">description</span>`;
            return `
                <div class="attachment-preview-item" data-index="${idx}">
                    ${icon}
                    <span class="truncate max-w-[80px]" title="${att.name}">${att.name}</span>
                    <span class="remove-btn" onclick="window.__removeAdminChatAttachment(${idx})">×</span>
                </div>
            `;
        }).join('');
    }

    window.__removeAdminChatAttachment = (index) => {
        window.__currentAttachments.splice(index, 1);
        renderAttachmentsPreview();
    };

    initApiKeys();

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

    const sanitizeFileName = (name) => {
        const extIndex = name.lastIndexOf('.');
        const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
        return baseName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9_]/g, '_')     // replace non-alphanumeric with underscore
            .replace(/_+/g, '_')             // dedup underscores
            .replace(/^_+|_+$/g, '');        // trim underscores
    };

    fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        const attachIcon = attachBtn.querySelector('span');
        const originalIcon = attachIcon.textContent;
        attachIcon.textContent = 'hourglass_empty';
        attachIcon.classList.add('animate-spin');
        chatInput.placeholder = 'Đang xử lý file...';
        chatInput.disabled = true;
        try {
            for (const file of files) {
                const ext = file.name.split('.').pop().toLowerCase();
                const cleanName = sanitizeFileName(file.name);
                if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                    await new Promise((resolve) => {
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
                                const imgId = "ATTACHED_IMAGE_" + cleanName + "_" + Math.floor(Math.random()*1000);
                                window.__currentAttachments.push({
                                    id: imgId,
                                    name: file.name,
                                    type: 'image',
                                    content: dataUrl
                                });
                                resolve();
                            };
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                    });
                } else if (ext === 'docx' || ext === 'doc') {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    const fileId = "ATTACHED_FILE_" + cleanName + "_" + Math.floor(Math.random()*1000);
                    window.__currentAttachments.push({
                        id: fileId,
                        name: file.name,
                        type: 'document',
                        content: result.value
                    });
                } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
                    const arrayBuffer = await file.arrayBuffer();
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    const csvStr = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
                    const fileId = "ATTACHED_FILE_" + cleanName + "_" + Math.floor(Math.random()*1000);
                    window.__currentAttachments.push({
                        id: fileId,
                        name: file.name,
                        type: 'document',
                        content: csvStr
                    });
                } else {
                    alert(`Định dạng file ${file.name} không được hỗ trợ!`);
                }
            }
            renderAttachmentsPreview();
        } catch (err) {
            console.error(err);
            alert('Lỗi xử lý file: ' + err.message);
        } finally {
            attachIcon.classList.remove('animate-spin');
            attachIcon.textContent = originalIcon;
            chatInput.placeholder = 'Hỏi về đơn hàng, chỉnh giá...';
            chatInput.disabled = false;
            fileInput.value = '';
            chatInput.focus();
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
        content: `You are a helpful Vietnamese restaurant AI Admin Assistant for Phở Việt Khang restaurant.
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

⚠️ MENU LOOKUP STRATEGY (MANDATORY):
Do NOT use listAllFoodItems (it returns everything and wastes tokens).
Instead, follow this 2-step approach:
1. Call listAllCategories() first → get category list with item summaries (id, name, price only).
2. If you need details (options, description, etc.) for specific items, call getFoodItemById(dishId) for each.
3. If you need all items in one category, call searchFoodByCategory(categoryVi).
This saves tokens and is much faster.

TOOLS AVAILABLE:
- Orders: getOrdersSoldToday, getOrdersByStatus, updateOrderStatus, deleteOrder
- Menu Browse: listAllCategories, searchFoodByCategory, getFoodItemById
- Menu Edit: updateMenuPrice, createMenuItem, setOptionChoicePrice, addMenuOptionGroup, removeMenuOptionGroup, addChoiceToOptionGroup, removeChoiceFromOptionGroup, updateMenuOptionGroup, updateChoiceInOptionGroup, updateMenuName, updateMenuDescription, updateMenuCategory, updateMenuAvailability, uploadMenuImage, removeMenuImage, updateMenuPreparationTime, updateMenuNutritionInfo, addMenuTag, removeMenuTag, reorderMenuItems, duplicateMenuItem, deleteMenuItem, updateMenuCustomFields
- Users: listAllUsers, getUserLoyalty, addLoyaltyProgressByOrderId, changeUserRole, createUserAccount, sendPasswordReset, sendSpinsToUser, createCustomVoucher, markVoucherUsed, removeVoucher, listAllVouchers, updateUserLoyaltyPoints(uidOrEmail, pointsAmount, isRelative), updateUserRank(uidOrEmail, targetRank), updateUserTotalSpent(uidOrEmail, totalSpentAmount, isRelative)
- Auth: adminListAuthUsers, adminDeleteAuthUser, adminDisableUser, adminEnableUser, adminChangeUserPassword, adminChangeUserEmail, adminVerifyUserEmail, adminSetCustomClaims, adminGetUserInfo, adminRevokeUserTokens, adminUpdateDisplayName, adminGenerateCustomToken
- Reservations: listAllReservations, createReservation(name, phone, email, date, time, guests, location, notes), updateReservationStatus(id, status), deleteReservation(id)
- Feedbacks & Contact Messages: listAllFeedbacks, replyToFeedback(id, replyText), deleteFeedback(id)
- Vouchers Management: updateVoucher(code, discountPercent, email, expiryDays, allowedTypes)
- Homepage Tools details:
  * getHomepageConfig() -> Fetches the current homepage configuration document (contains heroBgUrl, signatureDishIds, storyImg, etc.).
  * updateHomepageHero(imageUrl, titleVi, descVi) -> Updates the Hero section (can omit parameters).
  * updateHomepageHeroImage(imageUrl) -> Updates only the Hero background image.
  * updateHomepageHeroText(titleVi, titleEn, titleFi, descVi, descEn, descFi) -> Updates only the Hero title and description text (supports Vietnamese, English, Finnish).
  * updateHomepageSignatures(dishIdArray)
  * updateHomepageSignatureText(titleVi, titleEn, titleFi, descVi, descEn, descFi) -> Updates the Signature Creations section title and description text (supports Vietnamese, English, Finnish).
  * updateHomepageStory(imageUrl, labelVi, titleVi, p1Vi, p2Vi) -> Updates the Heritage section (Di sản của chúng tôi) (can omit parameters).
  * updateHomepageStoryImage(imageUrl) -> Updates only the Heritage section story image.
  * updateHomepageStoryText(labelVi, labelEn, labelFi, titleVi, titleEn, titleFi, p1Vi, p1En, p1Fi, p2Vi, p2En, p2Fi) -> Updates only the Heritage/Story text contents (supports Vietnamese, English, Finnish).
  * updateHomepageCTA(titleVi, titleEn, titleFi, descVi, descEn, descFi) -> Updates the Call to Action section (supports Vietnamese, English, Finnish).
  * getWheelGuarantee()
  * updateWheelGuarantee(next20, next50, next100)
  * updateHomepageReviews(reviews)
  * updateReviewImageUrl(index, imageUrl)
- Web: webSearch, browseWebUrl
- Messages: sendGlobalAnnouncement
- Email: sendEmail(to, subject, html) -> Sends a custom transactional email to a recipient email address using Resend API.`
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

    async function listAllCategories() {
        try {
            const qSnap = await getDocs(collection(db, "menu"));
            const catMap = {};
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                const catVi = data.categoryVi || data.category || 'Khác';
                if (!catMap[catVi]) catMap[catVi] = { categoryVi: catVi, categoryEn: data.categoryEn || '', categoryFi: data.categoryFi || '', items: [] };
                catMap[catVi].items.push({ id: docSnap.id, nameVi: data.nameVi || '', nameEn: data.nameEn || '', price: data.price, isAvailable: data.isAvailable !== false });
            });
            return Object.values(catMap).map(c => ({ ...c, itemCount: c.items.length }));
        } catch (e) { return { error: e.message }; }
    }

    async function searchFoodByCategory(categoryVi) {
        try {
            const qSnap = await getDocs(collection(db, "menu"));
            const items = [];
            const catLower = (categoryVi || '').toLowerCase();
            qSnap.forEach(docSnap => {
                const data = docSnap.data();
                const itemCat = (data.categoryVi || data.category || '').toLowerCase();
                if (itemCat === catLower) {
                    items.push({ id: docSnap.id, nameVi: data.nameVi || '', nameEn: data.nameEn || '', nameFi: data.nameFi || '', price: data.price, isAvailable: data.isAvailable !== false, options: (data.options || []).map(o => ({ name: o.nameVi || o.name, choiceCount: (o.choices || []).length })) });
                }
            });
            return items;
        } catch (e) { return { error: e.message }; }
    }

    async function getFoodItemById(dishId) {
        try {
            const snap = await getDoc(doc(db, "menu", dishId));
            if (!snap.exists()) return { error: 'Không tìm thấy món.' };
            const data = snap.data();
            return { id: snap.id, nameVi: data.nameVi || '', nameEn: data.nameEn || '', nameFi: data.nameFi || '', categoryVi: data.categoryVi || data.category || '', categoryEn: data.categoryEn || '', categoryFi: data.categoryFi || '', price: data.price, isAvailable: data.isAvailable !== false, image: data.image || '', descVi: data.descVi || '', descEn: data.descEn || '', descFi: data.descFi || '', preparationTime: data.preparationTime || 0, nutrition: data.nutrition || {}, tags: data.tags || [], options: data.options || [] };
        } catch (e) { return { error: e.message }; }
    }

    async function updateMenuPrice(dishId, newPrice) {
        try { await updateDoc(doc(db, "menu", dishId), { price: parseFloat(newPrice) }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật giá món thành công.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuName(dishId, nameVi, nameEn, nameFi) {
        try { const u = {}; if (nameVi !== undefined) u.nameVi = nameVi; if (nameEn !== undefined) u.nameEn = nameEn; if (nameFi !== undefined) u.nameFi = nameFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật tên món.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuDescription(dishId, descVi, descEn, descFi) {
        try { const u = {}; if (descVi !== undefined) u.descVi = descVi; if (descEn !== undefined) u.descEn = descEn; if (descFi !== undefined) u.descFi = descFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật mô tả.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuCategory(dishId, categoryVi, categoryEn, categoryFi) {
        try { const u = {}; if (categoryVi !== undefined) { u.category = categoryVi; u.categoryVi = categoryVi; } if (categoryEn !== undefined) u.categoryEn = categoryEn; if (categoryFi !== undefined) u.categoryFi = categoryFi; await updateDoc(doc(db, "menu", dishId), u); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật danh mừc.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuAvailability(dishId, isAvailable) {
        try { await updateDoc(doc(db, "menu", dishId), { isAvailable: !!isAvailable }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật trảng thái.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function uploadMenuImage(dishId, imageUrl) {
        try { await updateDoc(doc(db, "menu", dishId), { image: imageUrl }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật ảnh.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuImage(dishId) {
        try { await updateDoc(doc(db, "menu", dishId), { image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500' }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã xoá ảnh.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuPreparationTime(dishId, minutes) {
        try { await updateDoc(doc(db, "menu", dishId), { preparationTime: parseInt(minutes) || 0 }); return { success: true, message: `Đã cập nhật thời gian chuẩn bị.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuNutritionInfo(dishId, calories, protein, fat, carbs) {
        try { await updateDoc(doc(db, "menu", dishId), { nutrition: { calories: parseFloat(calories) || 0, protein: parseFloat(protein) || 0, fat: parseFloat(fat) || 0, carbs: parseFloat(carbs) || 0 } }); return { success: true, message: `Đã cập nhật dinh dưỡng.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function addMenuTag(dishId, tagLabelVi, tagLabelEn, tagLabelFi) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; const tags = snap.data().tags || []; const lVi = tagLabelVi || '', lEn = tagLabelEn || lVi, lFi = tagLabelFi || lVi; if (!tags.some(t => (t.labelVi||'').toLowerCase() === lVi.toLowerCase())) tags.push({ labelVi: lVi, labelEn: lEn, labelFi: lFi }); await updateDoc(doc(db, "menu", dishId), { tags }); return { success: true, message: `Đã thêm tag "${lVi}".` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuTag(dishId, tagLabel) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; const tags = snap.data().tags || []; const newTags = tags.filter(t => (t.labelVi||'').toLowerCase() !== tagLabel.toLowerCase() && (t.labelEn||'').toLowerCase() !== tagLabel.toLowerCase() && (t.labelFi||'').toLowerCase() !== tagLabel.toLowerCase()); if (tags.length === newTags.length) return { error: `Không tìm thấy tag "${tagLabel}".` }; await updateDoc(doc(db, "menu", dishId), { tags: newTags }); return { success: true, message: `Đã xoá tag.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function reorderMenuItems(orderedDishIds) {
        try { for (let i = 0; i < orderedDishIds.length; i++) await updateDoc(doc(db, "menu", orderedDishIds[i]), { sortOrder: i }); return { success: true, message: "Đã sắp xếp lải." }; }
        catch (e) { return { error: e.message }; }
    }

    async function duplicateMenuItem(dishId) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; const newRef = await addDoc(collection(db, "menu"), { ...snap.data(), nameVi: (snap.data().nameVi || "") + " (Bản sao)", createdAt: new Date() }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã nhân bản với ID: ${newRef.id}` }; }
        catch (e) { return { error: e.message }; }
    }

    async function deleteMenuItem(dishId) {
        try { await deleteDoc(doc(db, "menu", dishId)); if (window.loadFood) window.loadFood(); if (window.loadCategories) window.loadCategories(); return { success: true, message: `Đã xoá món.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuCustomFields(dishId, customFields) {
        try { await updateDoc(doc(db, "menu", dishId), customFields); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật trường tuỳ chỉnh.` }; }
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
            return { success: true, message: `Đã cập nhật giá ${choiceLabel} thành ${newPrice}€.` };
        } catch (e) { return { error: e.message }; }
    }

    async function addMenuOptionGroup(dishId, optionNameVi, optionNameEn, optionNameFi, optionType, choices) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; const options = snap.data().options || []; options.push({ name: optionNameEn || optionNameVi, nameVi: optionNameVi, nameEn: optionNameEn || optionNameVi, nameFi: optionNameFi || optionNameVi, type: optionType || 'toggle', choices: (choices||[]).map(c => ({ label: c.labelEn || c.labelVi, labelVi: c.labelVi, labelEn: c.labelEn || c.labelVi, labelFi: c.labelFi || c.labelVi, price: parseFloat(c.price)||0 })) }); await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã thêm nhóm option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeMenuOptionGroup(dishId, optionName) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; const options = (snap.data().options || []).filter(opt => ![opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())); await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã xoá nhóm option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function addChoiceToOptionGroup(dishId, optionName, choiceLabelVi, choiceLabelEn, choiceLabelFi, choicePrice) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { opt.choices.push({ label: choiceLabelEn || choiceLabelVi, labelVi: choiceLabelVi, labelEn: choiceLabelEn || choiceLabelVi, labelFi: choiceLabelFi || choiceLabelVi, price: parseFloat(choicePrice)||0 }); updated = true; } return opt; }); if (!updated) return { error: "Không tìm thấy nhóm option." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã thêm lựa chọn.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeChoiceFromOptionGroup(dishId, optionName, choiceLabel) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { const origLen = opt.choices.length; opt.choices = opt.choices.filter(c => ![c.label, c.labelVi, c.labelEn, c.labelFi].some(l => (l||'').toLowerCase() === choiceLabel.toLowerCase())); if (opt.choices.length < origLen) updated = true; } return opt; }); if (!updated) return { error: "Không tìm thấy." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã xoá lựa chọn.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateMenuOptionGroup(dishId, oldOptionName, newOptionNameVi, newOptionNameEn, newOptionNameFi, newOptionType) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === oldOptionName.toLowerCase())) { if (newOptionNameVi) opt.nameVi = newOptionNameVi; if (newOptionNameEn) { opt.nameEn = newOptionNameEn; opt.name = newOptionNameEn; } if (newOptionNameFi) opt.nameFi = newOptionNameFi; if (newOptionType) opt.type = newOptionType; updated = true; } return opt; }); if (!updated) return { error: "Không tìm thấy." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật nhóm option.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function updateChoiceInOptionGroup(dishId, optionName, oldChoiceLabel, newChoiceLabelVi, newChoiceLabelEn, newChoiceLabelFi, newChoicePrice) {
        try { const snap = await getDoc(doc(db, "menu", dishId)); if (!snap.exists()) return { error: "Không tìm thấy món." }; let updated = false; const options = (snap.data().options || []).map(opt => { if ([opt.name, opt.nameVi, opt.nameEn, opt.nameFi].some(n => (n||'').toLowerCase() === optionName.toLowerCase())) { opt.choices = opt.choices.map(c => { const matches = [c.label, c.labelVi, c.labelEn, c.labelFi].some(l => (l||'').toLowerCase() === oldChoiceLabel.toLowerCase()); if (matches) { if (newChoiceLabelVi) c.labelVi = newChoiceLabelVi; if (newChoiceLabelEn) { c.labelEn = newChoiceLabelEn; c.label = newChoiceLabelEn; } if (newChoiceLabelFi) c.labelFi = newChoiceLabelFi; if (newChoicePrice !== undefined && newChoicePrice !== null) c.price = parseFloat(newChoicePrice); updated = true; } return c; }); } return opt; }); if (!updated) return { error: "Không tìm thấy." }; await updateDoc(doc(db, "menu", dishId), { options }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã cập nhật lựa chọn.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function createMenuItem(nameVi, nameEn, nameFi, price, categoryVi, categoryEn, categoryFi, descVi, descEn, descFi, imageUrl) {
        try { const ref = await addDoc(collection(db, "menu"), { nameVi: nameVi||"", nameEn: nameEn||"", nameFi: nameFi||"", price: parseFloat(price)||0, categoryVi: categoryVi||"", categoryEn: categoryEn||"", categoryFi: categoryFi||"", descVi: descVi||"", descEn: descEn||"", descFi: descFi||"", image: imageUrl||"", isAvailable: true, preparationTime: 15, nutrition: { calories: 0, protein: 0, fat: 0, carbs: 0 }, tags: [], options: [] }); if (window.loadFood) window.loadFood(); return { success: true, message: `Đã tạo món với ID: ${ref.id}` }; }
        catch (e) { return { error: e.message }; }
    }

    async function changeUserRole(uid, newRole) {
        try { await updateDoc(doc(db, "users", uid), { role: newRole }); if (window.loadUsers) window.loadUsers(); return { success: true, message: `Đã đổi role user ${uid} thành ${newRole}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function getUserLoyalty(uid) {
        try { const snap = await getDoc(doc(db, "users", uid)); if (!snap.exists()) return { error: "Không tìm thấy user." }; const totalSpent = snap.data().totalSpent||0; const tier = computeLoyaltyTier(totalSpent); return { uid, totalSpent, tier: tier.key, tierLabelVi: tier.labelVi, discountPercent: tier.discountPercent }; }
        catch (e) { return { error: e.message }; }
    }

    async function addLoyaltyProgressByOrderId(orderId) {
        try { const snap = await getDoc(doc(db, "orders", orderId)); if (!snap.exists()) return { error: "Không tìm thấy đơn." }; const order = snap.data(); const userId = order.userId; if (!userId) return { error: "Không có userId." }; const EUR_RATE = 25000; const totalEur = +((order.totalPrice||0) / EUR_RATE).toFixed(2); await updateDoc(doc(db, "users", userId), { ...(order.totalSpent ? { totalSpent: Number(((order.totalSpent + totalEur).toFixed(2))) } : { totalSpent: totalEur }) }); return { success: true, message: `Đã cộng ${totalEur} EUR loyalty.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function sendPasswordReset(email) {
        try { await callWorker('sendPasswordReset', { email }); return { success: true, message: `Đã gửi email reset password tới ${email}.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function sendSpinsToUser(uidOrEmail, spinType, count) {
        try {
            if (!uidOrEmail) return { error: "Thiếu uidOrEmail." };
            let type = String(spinType || 'deu').trim().toLowerCase();
            if (['thuong', 'thường', 'normal', 'standard', 'deu'].includes(type)) type = 'deu';
            else if (['xin', 'xịn', 'good', 'super'].includes(type)) type = 'xin';
            else if (['vip'].includes(type)) type = 'vip';
            
            if (!['deu','xin','vip'].includes(type)) {
                return { error: `Loại spinType "${spinType}" không hợp lệ. Phải là: Thường (deu), Xịn (xin), hoặc VIP (vip).` };
            }
            const qty = parseInt(count, 10) || 1;
            let uid = String(uidOrEmail).trim();
            if (uid.includes('@')) {
                const emailLower = uid.toLowerCase();
                const q = query(collection(db, "users"), where("email", "==", emailLower));
                let snap = await getDocs(q);
                if (snap.empty) {
                    const q2 = query(collection(db, "users"), where("email", "==", uid));
                    snap = await getDocs(q2);
                }
                if (snap.empty) return { error: `Không tìm thấy user với email: ${uid}` };
                uid = snap.docs[0].id;
            }
            const userSnap = await getDoc(doc(db, "users", uid));
            if (!userSnap.exists()) return { error: `Không tìm thấy user profile với UID: ${uid}` };
            const data = userSnap.data();
            const spins = data.spins || { deu: 0, xin: 0, vip: 0 };
            spins.deu = parseInt(spins.deu, 10) || 0;
            spins.xin = parseInt(spins.xin, 10) || 0;
            spins.vip = parseInt(spins.vip, 10) || 0;
            spins[type] += qty;
            await updateDoc(doc(db, "users", uid), { spins });
            return { success: true, message: `Đã tặng thành công ${qty} lượt quay hạng "${type}" cho user ${uid}.` };
        }
        catch (e) { return { error: e.message }; }
    }

    async function updateUserLoyaltyPoints(uidOrEmail, pointsAmount, isRelative) {
        try {
            if (!uidOrEmail) return { error: "Thiếu uidOrEmail." };
            let uid = String(uidOrEmail).trim();
            if (uid.includes('@')) {
                const emailLower = uid.toLowerCase();
                const q = query(collection(db, "users"), where("email", "==", emailLower));
                let snap = await getDocs(q);
                if (snap.empty) {
                    const q2 = query(collection(db, "users"), where("email", "==", uid));
                    snap = await getDocs(q2);
                }
                if (snap.empty) return { error: `Không tìm thấy user với email: ${uid}` };
                uid = snap.docs[0].id;
            }
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return { error: `Không tìm thấy user profile với UID: ${uid}` };
            
            const currentPoints = Number(userSnap.data().loyaltyPoints || 0);
            const amount = Number(pointsAmount) || 0;
            const updatedPoints = isRelative ? currentPoints + amount : amount;
            
            await updateDoc(userRef, { 
                loyaltyPoints: updatedPoints,
                updatedAt: new Date()
            });
            if (window.loadUsers) window.loadUsers();
            return { success: true, message: `Đã cập nhật điểm tích lũy của user ${uid} thành ${updatedPoints} điểm (Trước đó: ${currentPoints}).` };
        } catch (e) { return { error: e.message }; }
    }

    async function updateUserRank(uidOrEmail, targetRank) {
        try {
            if (!uidOrEmail) return { error: "Thiếu uidOrEmail." };
            if (!targetRank) return { error: "Thiếu hạng/rank muốn thay đổi." };
            let uid = String(uidOrEmail).trim();
            if (uid.includes('@')) {
                const emailLower = uid.toLowerCase();
                const q = query(collection(db, "users"), where("email", "==", emailLower));
                let snap = await getDocs(q);
                if (snap.empty) {
                    const q2 = query(collection(db, "users"), where("email", "==", uid));
                    snap = await getDocs(q2);
                }
                if (snap.empty) return { error: `Không tìm thấy user với email: ${uid}` };
                uid = snap.docs[0].id;
            }
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return { error: `Không tìm thấy user profile với UID: ${uid}` };
            
            const rankClean = String(targetRank).trim().toLowerCase();
            let newSpent = 0;
            let rankLabel = "";
            
            if (['kim_cuong', 'kim cuong', 'diamond', 'kim cương'].includes(rankClean)) {
                newSpent = 1000000;
                rankLabel = "Kim Cương (Diamond)";
            } else if (['platinum', 'bạch kim', 'bach kim'].includes(rankClean)) {
                newSpent = 500000;
                rankLabel = "Bạch Kim (Platinum)";
            } else if (['gold', 'vang', 'vàng', 'kim'].includes(rankClean)) {
                newSpent = 200000;
                rankLabel = "Vàng (Gold)";
            } else if (['silver', 'bac', 'bạc'].includes(rankClean)) {
                newSpent = 100000;
                rankLabel = "Bạc (Silver)";
            } else {
                newSpent = 0;
                rankLabel = "Đồng (Bronze)";
            }
            
            await updateDoc(userRef, { 
                totalSpent: newSpent,
                updatedAt: new Date()
            });
            if (window.loadUsers) window.loadUsers();
            return { success: true, message: `Đã cập nhật rank của user ${uid} thành "${rankLabel}" (totalSpent đặt thành ${newSpent}).` };
        } catch (e) { return { error: e.message }; }
    }

    async function updateUserTotalSpent(uidOrEmail, totalSpentAmount, isRelative) {
        try {
            if (!uidOrEmail) return { error: "Thiếu uidOrEmail." };
            let uid = String(uidOrEmail).trim();
            if (uid.includes('@')) {
                const emailLower = uid.toLowerCase();
                const q = query(collection(db, "users"), where("email", "==", emailLower));
                let snap = await getDocs(q);
                if (snap.empty) {
                    const q2 = query(collection(db, "users"), where("email", "==", uid));
                    snap = await getDocs(q2);
                }
                if (snap.empty) return { error: `Không tìm thấy user với email: ${uid}` };
                uid = snap.docs[0].id;
            }
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) return { error: `Không tìm thấy user profile với UID: ${uid}` };
            
            const currentSpent = Number(userSnap.data().totalSpent || 0);
            const amt = Number(totalSpentAmount) || 0;
            const updatedSpent = isRelative ? currentSpent + amt : amt;
            
            await updateDoc(userRef, { 
                totalSpent: updatedSpent,
                updatedAt: new Date()
            });
            if (window.loadUsers) window.loadUsers();
            return { success: true, message: `Đã cập nhật doanh thu tích lũy (totalSpent) của user ${uid} thành ${updatedSpent} (Trước đó: ${currentSpent}).` };
        } catch (e) { return { error: e.message }; }
    }

    async function sendEmail(to, subject, html) {
        try {
            const r = await callWorker('sendEmail', { to, subject, html });
            return r;
        } catch (e) {
            return { error: e.message };
        }
    }

    async function createCustomVoucher(email, discountPercent, expiryDays, allowedTypes) {
        try { const code = `PROMO${discountPercent}-${Math.random().toString(36).substring(2,6).toUpperCase()}`; let expiryDate = null; if (expiryDays && expiryDays !== 'never') { expiryDate = new Date(); expiryDate.setDate(expiryDate.getDate() + parseInt(expiryDays)); } await setDoc(doc(db, "vouchers", code), { code, discountPercent: parseInt(discountPercent)||10, email: (email||'').trim(), used: false, allowedOrderTypes: allowedTypes||[], expiryDate, createdAt: new Date() }); return { success: true, message: `Đã tạo voucher ${code} (${discountPercent}% OFF).` }; }
        catch (e) { return { error: e.message }; }
    }

    async function markVoucherUsed(voucherCode) {
        try { const code = (voucherCode||'').trim().toUpperCase(); if (!code) return { error: 'Required.' }; const snap = await getDoc(doc(db, "vouchers", code)); if (!snap.exists()) return { error: `Không tìm thấy voucher.` }; await updateDoc(doc(db, "vouchers", code), { used: true }); return { success: true, message: `Đã đánh dấu đã dùng.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function removeVoucher(voucherCode) {
        try { const code = (voucherCode||'').trim().toUpperCase(); if (!code) return { error: 'Required.' }; const snap = await getDoc(doc(db, "vouchers", code)); if (!snap.exists()) return { error: `Không tìm thấy.` }; await deleteDoc(doc(db, "vouchers", code)); return { success: true, message: `Đã xoá voucher.` }; }
        catch (e) { return { error: e.message }; }
    }

    async function listAllVouchers() {
        try { const qSnap = await getDocs(collection(db, "vouchers")); const vouchers = []; qSnap.forEach(d => { const data = d.data(); vouchers.push({ code: d.id, discountPercent: data.discountPercent, email: data.email||'', used: data.used||false, expiryDate: data.expiryDate ? data.expiryDate.toDate().toISOString() : null, allowedOrderTypes: data.allowedOrderTypes||[] }); }); return vouchers; }
        catch (e) { return { error: e.message }; }
    }

    async function sendGlobalAnnouncement(title, text, imageUrl) {
        try { await addDoc(collection(db, "messages"), { title: title||"", text: text||"", imageUrl: imageUrl||null, voucherCode: null, giftSpins: null, recipientId: 'all', readBy: [], createdAt: new Date() }); return { success: true, message: "Đã gửi thông báo tới tất cả user." }; }
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
    async function adminDeleteAuthUser(uid) { try { await callWorker('deleteAuthUser', { uid }); try { await deleteDoc(doc(db, 'users', uid)); } catch(_) {} if (window.loadUsers) window.loadUsers(); return { success: true, message: `Đã xoá user.` }; } catch (e) { return { error: e.message }; } }
    async function adminDisableUser(uid) { try { return await callWorker('disableUser', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminEnableUser(uid) { try { return await callWorker('enableUser', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminChangeUserPassword(uid, newPassword) { try { return await callWorker('changeUserPassword', { uid, newPassword }); } catch (e) { return { error: e.message }; } }
    async function adminChangeUserEmail(uid, newEmail) { try { const r = await callWorker('changeUserEmail', { uid, newEmail }); try { await updateDoc(doc(db, 'users', uid), { email: newEmail }); } catch(_) {} return r; } catch (e) { return { error: e.message }; } }
    async function adminVerifyUserEmail(uid) { try { return await callWorker('verifyUserEmail', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminSetCustomClaims(uid, claims) { try { return await callWorker('setCustomClaims', { uid, claims }); } catch (e) { return { error: e.message }; } }
    async function adminGetUserInfo(uid, email) { try { return await callWorker('getUserInfo', { uid, email }); } catch (e) { return { error: e.message }; } }
    async function adminRevokeUserTokens(uid) { try { return await callWorker('revokeUserTokens', { uid }); } catch (e) { return { error: e.message }; } }
    async function adminUpdateDisplayName(uid, displayName) { try { const r = await callWorker('updateDisplayName', { uid, displayName }); try { await updateDoc(doc(db, 'users', uid), { name: displayName }); } catch(_) {} return r; } catch (e) { return { error: e.message }; } }
    async function adminGenerateCustomToken(uid) { return { success: false, message: "Cần Firebase Admin SDK (Blaze Plan)." }; }

    async function listAllReservations() {
        try {
            const qSnap = await getDocs(collection(db, "reservations"));
            const list = [];
            qSnap.forEach(docSnap => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            return list;
        } catch (e) { return { error: e.message }; }
    }

    async function createReservation(name, phone, email, date, time, guests, location, notes) {
        try {
            const locLabel = (location || '').toLowerCase() === 'easton' ? 'Easton Helsinki' : 'Pengerkatu';
            const ref = await addDoc(collection(db, "reservations"), {
                name: name || "",
                phone: phone || "",
                email: email || "",
                date: date || "",
                time: time || "",
                guests: parseInt(guests, 10) || 2,
                location: locLabel,
                notes: notes || "",
                status: 'pending',
                createdAt: new Date()
            });
            return { success: true, message: `Đã tạo đặt bàn với ID: ${ref.id}` };
        } catch (e) { return { error: e.message }; }
    }

    async function updateReservationStatus(id, status) {
        try {
            await updateDoc(doc(db, "reservations", id), { status: status });
            return { success: true, message: `Đã cập nhật trạng thái đặt bàn ${id} thành ${status}.` };
        } catch (e) { return { error: e.message }; }
    }

    async function deleteReservation(id) {
        try {
            await deleteDoc(doc(db, "reservations", id));
            return { success: true, message: `Đã xoá đặt bàn ${id}.` };
        } catch (e) { return { error: e.message }; }
    }

    async function listAllFeedbacks() {
        try {
            const qSnap = await getDocs(collection(db, "feedback"));
            const list = [];
            qSnap.forEach(docSnap => {
                list.push({ id: docSnap.id, ...docSnap.data() });
            });
            return list;
        } catch (e) { return { error: e.message }; }
    }

    async function replyToFeedback(id, replyText) {
        try {
            const feedbackRef = doc(db, "feedback", id);
            const snap = await getDoc(feedbackRef);
            if (!snap.exists()) return { error: "Không tìm thấy phản hồi." };
            const data = snap.data();
            
            if (data.email) {
                const html = `
                    <div style="font-family:sans-serif; padding:20px; line-height:1.6;">
                        <h2 style="color:#3b82f6;">Phở Việt Khang - Phản hồi thư liên hệ</h2>
                        <p>Xin chào <strong>${data.name || 'Quý khách'}</strong>,</p>
                        <p>Chúng tôi đã nhận được thông điệp của bạn: <em>"${data.message}"</em>.</p>
                        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                        <p><strong>Câu trả lời từ chúng tôi:</strong></p>
                        <p style="background:#f9fafb; padding:15px; border-left:4px solid #3b82f6; font-style:italic;">${replyText}</p>
                        <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                        <p>Trân trọng cảm ơn quý khách!</p>
                        <p><strong>Phở Việt Khang Team</strong></p>
                    </div>
                `;
                await callWorker('sendEmail', { to: data.email, subject: 'Phản hồi từ Phở Việt Khang', html });
            }
            
            await updateDoc(feedbackRef, { status: 'read', reply: replyText });
            return { success: true, message: `Đã gửi phản hồi thành công qua email.` };
        } catch (e) { return { error: e.message }; }
    }

    async function deleteFeedback(id) {
        try {
            await deleteDoc(doc(db, "feedback", id));
            return { success: true, message: `Đã xoá phản hồi ${id}.` };
        } catch (e) { return { error: e.message }; }
    }

    async function updateVoucher(code, discountPercent, email, expiryDays, allowedTypes) {
        try {
            const cleanCode = (code || '').trim().toUpperCase();
            if (!cleanCode) return { error: 'Voucher code is required.' };
            const ref = doc(db, "vouchers", cleanCode);
            const snap = await getDoc(ref);
            if (!snap.exists()) return { error: `Voucher "${cleanCode}" không tồn tại.` };
            
            const updates = {};
            if (discountPercent !== undefined && discountPercent !== null) {
                updates.discountPercent = parseInt(discountPercent, 10);
            }
            if (email !== undefined) {
                updates.email = (email || '').trim().toLowerCase() || null;
            }
            if (expiryDays !== undefined && expiryDays !== null) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + parseInt(expiryDays, 10));
                updates.expiryDate = expiry;
            }
            if (allowedTypes !== undefined) {
                let allowedOrderTypes = ['takeaway', 'delivery', 'dine-in'];
                if (Array.isArray(allowedTypes)) {
                    allowedOrderTypes = allowedTypes;
                } else if (typeof allowedTypes === 'string') {
                    allowedOrderTypes = allowedTypes.split(',').map(t => t.trim()).filter(Boolean);
                }
                updates.allowedOrderTypes = allowedOrderTypes;
            }
            
            await updateDoc(ref, updates);
            return { success: true, message: `Đã cập nhật voucher ${cleanCode}.` };
        } catch (e) { return { error: e.message }; }
    }

    async function getHomepageConfig() {
        try {
            const snap = await getDoc(doc(db, "config", "homepage"));
            return snap.exists() ? snap.data() : {};
        } catch (e) { return { error: e.message }; }
    }
    async function updateHomepageHero(imageUrl, titleVi, descVi) {
        try {
            const u = {};
            if (imageUrl !== undefined && imageUrl !== null) u.heroBgUrl = imageUrl;
            if (titleVi !== undefined && titleVi !== null) u.heroTitleVi = titleVi;
            if (descVi !== undefined && descVi !== null) u.heroDescVi = descVi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "Hero updated." };
        }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageHeroImage(imageUrl) {
        try {
            await setDoc(doc(db, "config", "homepage"), { heroBgUrl: imageUrl||null }, { merge: true });
            return { success: true, message: "Hero background image updated." };
        } catch (e) { return { error: e.message }; }
    }
    async function updateHomepageHeroText(titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            const u = {};
            if (titleVi !== undefined && titleVi !== null) u.heroTitleVi = titleVi;
            if (titleEn !== undefined && titleEn !== null) u.heroTitleEn = titleEn;
            if (titleFi !== undefined && titleFi !== null) u.heroTitleFi = titleFi;
            if (descVi !== undefined && descVi !== null) u.heroDescVi = descVi;
            if (descEn !== undefined && descEn !== null) u.heroDescEn = descEn;
            if (descFi !== undefined && descFi !== null) u.heroDescFi = descFi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "Hero text updated." };
        } catch (e) { return { error: e.message }; }
    }
    async function updateHomepageSignatures(dishIdArray) {
        if (typeof dishIdArray === 'string') {
            try {
                const parsed = JSON.parse(dishIdArray);
                if (Array.isArray(parsed)) dishIdArray = parsed;
                else dishIdArray = dishIdArray.split(',').map(s => s.trim()).filter(Boolean);
            } catch (e) {
                dishIdArray = dishIdArray.split(',').map(s => s.trim()).filter(Boolean);
            }
        }
        if (!Array.isArray(dishIdArray)) return { error: "dishIdArray must be an array" };
        try { await setDoc(doc(db, "config", "homepage"), { signatureDishIds: dishIdArray }, { merge: true }); return { success: true, message: "Signatures updated." }; }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageSignatureText(titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            const u = {};
            if (titleVi !== undefined && titleVi !== null) u.signatureTitleVi = titleVi;
            if (titleEn !== undefined && titleEn !== null) u.signatureTitleEn = titleEn;
            if (titleFi !== undefined && titleFi !== null) u.signatureTitleFi = titleFi;
            if (descVi !== undefined && descVi !== null) u.signatureDescVi = descVi;
            if (descEn !== undefined && descEn !== null) u.signatureDescEn = descEn;
            if (descFi !== undefined && descFi !== null) u.signatureDescFi = descFi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "Signature text updated." };
        }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageStory(imageUrl, labelVi, titleVi, p1Vi, p2Vi) {
        try {
            const u = {};
            if (imageUrl !== undefined && imageUrl !== null) u.storyImg = imageUrl;
            if (labelVi !== undefined && labelVi !== null) u.storyLabelVi = labelVi;
            if (titleVi !== undefined && titleVi !== null) u.storyTitleVi = titleVi;
            if (p1Vi !== undefined && p1Vi !== null) u.storyP1Vi = p1Vi;
            if (p2Vi !== undefined && p2Vi !== null) u.storyP2Vi = p2Vi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "Story updated." };
        }
        catch (e) { return { error: e.message }; }
    }
    async function updateHomepageStoryImage(imageUrl) {
        try {
            await setDoc(doc(db, "config", "homepage"), { storyImg: imageUrl||null }, { merge: true });
            return { success: true, message: "Story image updated." };
        } catch (e) { return { error: e.message }; }
    }
    async function updateHomepageStoryText(labelVi, labelEn, labelFi, titleVi, titleEn, titleFi, p1Vi, p1En, p1Fi, p2Vi, p2En, p2Fi) {
        try {
            const u = {};
            if (labelVi !== undefined && labelVi !== null) u.storyLabelVi = labelVi;
            if (labelEn !== undefined && labelEn !== null) u.storyLabelEn = labelEn;
            if (labelFi !== undefined && labelFi !== null) u.storyLabelFi = labelFi;
            if (titleVi !== undefined && titleVi !== null) u.storyTitleVi = titleVi;
            if (titleEn !== undefined && titleEn !== null) u.storyTitleEn = titleEn;
            if (titleFi !== undefined && titleFi !== null) u.storyTitleFi = titleFi;
            if (p1Vi !== undefined && p1Vi !== null) u.storyP1Vi = p1Vi;
            if (p1En !== undefined && p1En !== null) u.storyP1En = p1En;
            if (p1Fi !== undefined && p1Fi !== null) u.storyP1Fi = p1Fi;
            if (p2Vi !== undefined && p2Vi !== null) u.storyP2Vi = p2Vi;
            if (p2En !== undefined && p2En !== null) u.storyP2En = p2En;
            if (p2Fi !== undefined && p2Fi !== null) u.storyP2Fi = p2Fi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "Story text updated." };
        } catch (e) { return { error: e.message }; }
    }
    async function updateHomepageCTA(titleVi, titleEn, titleFi, descVi, descEn, descFi) {
        try {
            const u = {};
            if (titleVi !== undefined && titleVi !== null) u.ctaTitleVi = titleVi;
            if (titleEn !== undefined && titleEn !== null) u.ctaTitleEn = titleEn;
            if (titleFi !== undefined && titleFi !== null) u.ctaTitleFi = titleFi;
            if (descVi !== undefined && descVi !== null) u.ctaDescVi = descVi;
            if (descEn !== undefined && descEn !== null) u.ctaDescEn = descEn;
            if (descFi !== undefined && descFi !== null) u.ctaDescFi = descFi;
            await setDoc(doc(db, "config", "homepage"), u, { merge: true });
            return { success: true, message: "CTA updated." };
        } catch (e) { return { error: e.message }; }
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
        try { const snap = await getDoc(doc(db, "config", "homepage")); const reviews = snap.exists() ? (snap.data().customReviews||[]) : []; if (index < 0 || index >= reviews.length) return { error: `Index ${index} không hợp lệ.` }; reviews[index] = { ...reviews[index], avatar: imageUrl||reviews[index].avatar }; await setDoc(doc(db, "config", "homepage"), { customReviews: reviews }, { merge: true }); return { success: true, message: `Đã cập nhật ảnh review.` }; }
        catch (e) { return { error: e.message }; }
    }
    async function webSearch(query) { try { return await callWorker('webSearch', { query }); } catch (e) { return { error: e.message }; } }
    async function browseWebUrl(url) { try { return await callWorker('browseWebUrl', { url }); } catch (e) { return { error: e.message }; } }

    // Tool registry: each value is { fn, params } for safe named-arg dispatch
    const toolRegistry = {
        getOrdersSoldToday:       { fn: getOrdersSoldToday, params: [] },
        getOrdersByStatus:        { fn: getOrdersByStatus, params: ['status'] },
        updateOrderStatus:        { fn: updateOrderStatus, params: ['orderId', 'newStatus'] },
        deleteOrder:              { fn: deleteOrder, params: ['orderId'] },
        listAllCategories:        { fn: listAllCategories, params: [] },
        searchFoodByCategory:     { fn: searchFoodByCategory, params: ['categoryVi'] },
        getFoodItemById:          { fn: getFoodItemById, params: ['dishId'] },
        updateMenuPrice:          { fn: updateMenuPrice, params: ['dishId', 'newPrice'] },
        setOptionChoicePrice:     { fn: setOptionChoicePrice, params: ['dishId', 'optionName', 'choiceLabel', 'newPrice'] },
        addMenuOptionGroup:       { fn: addMenuOptionGroup, params: ['dishId', 'optionNameVi', 'optionNameEn', 'optionNameFi', 'optionType', 'choices'] },
        removeMenuOptionGroup:    { fn: removeMenuOptionGroup, params: ['dishId', 'optionName'] },
        addChoiceToOptionGroup:   { fn: addChoiceToOptionGroup, params: ['dishId', 'optionName', 'choiceLabelVi', 'choiceLabelEn', 'choiceLabelFi', 'choicePrice'] },
        removeChoiceFromOptionGroup: { fn: removeChoiceFromOptionGroup, params: ['dishId', 'optionName', 'choiceLabel'] },
        updateMenuOptionGroup:    { fn: updateMenuOptionGroup, params: ['dishId', 'oldOptionName', 'newOptionNameVi', 'newOptionNameEn', 'newOptionNameFi', 'newOptionType'] },
        updateChoiceInOptionGroup:{ fn: updateChoiceInOptionGroup, params: ['dishId', 'optionName', 'oldChoiceLabel', 'newChoiceLabelVi', 'newChoiceLabelEn', 'newChoiceLabelFi', 'newChoicePrice'] },
        updateMenuName:           { fn: updateMenuName, params: ['dishId', 'nameVi', 'nameEn', 'nameFi'] },
        updateMenuDescription:    { fn: updateMenuDescription, params: ['dishId', 'descVi', 'descEn', 'descFi'] },
        updateMenuCategory:       { fn: updateMenuCategory, params: ['dishId', 'categoryVi', 'categoryEn', 'categoryFi'] },
        updateMenuAvailability:   { fn: updateMenuAvailability, params: ['dishId', 'isAvailable'] },
        uploadMenuImage:          { fn: uploadMenuImage, params: ['dishId', 'imageUrl'] },
        removeMenuImage:          { fn: removeMenuImage, params: ['dishId'] },
        updateMenuPreparationTime:{ fn: updateMenuPreparationTime, params: ['dishId', 'minutes'] },
        updateMenuNutritionInfo:  { fn: updateMenuNutritionInfo, params: ['dishId', 'calories', 'protein', 'fat', 'carbs'] },
        addMenuTag:               { fn: addMenuTag, params: ['dishId', 'tagLabelVi', 'tagLabelEn', 'tagLabelFi'] },
        removeMenuTag:            { fn: removeMenuTag, params: ['dishId', 'tagLabel'] },
        reorderMenuItems:         { fn: reorderMenuItems, params: ['orderedDishIds'] },
        duplicateMenuItem:        { fn: duplicateMenuItem, params: ['dishId'] },
        deleteMenuItem:           { fn: deleteMenuItem, params: ['dishId'] },
        updateMenuCustomFields:   { fn: updateMenuCustomFields, params: ['dishId', 'customFields'] },
        createMenuItem:           { fn: createMenuItem, params: ['nameVi', 'nameEn', 'nameFi', 'price', 'categoryVi', 'categoryEn', 'categoryFi', 'descVi', 'descEn', 'descFi', 'imageUrl'] },
        listAllUsers:             { fn: () => listAllUsers(), params: [] },
        changeUserRole:           { fn: changeUserRole, params: ['uid', 'newRole'] },
        getUserLoyalty:           { fn: getUserLoyalty, params: ['uid'] },
        addLoyaltyProgressByOrderId: { fn: addLoyaltyProgressByOrderId, params: ['orderId'] },
        createUserAccount:        { fn: createUserAccount, params: ['email', 'password', 'name', 'role'] },
        sendPasswordReset:        { fn: sendPasswordReset, params: ['email'] },
        sendSpinsToUser:          { fn: sendSpinsToUser, params: ['uidOrEmail', 'spinType', 'count'] },
        createCustomVoucher:      { fn: createCustomVoucher, params: ['email', 'discountPercent', 'expiryDays', 'allowedTypes'] },
        markVoucherUsed:          { fn: markVoucherUsed, params: ['voucherCode'] },
        removeVoucher:            { fn: removeVoucher, params: ['voucherCode'] },
        listAllVouchers:          { fn: listAllVouchers, params: [] },
        sendGlobalAnnouncement:   { fn: sendGlobalAnnouncement, params: ['title', 'text', 'imageUrl'] },
        changeCurrentAdminPassword: { fn: changeCurrentAdminPassword, params: ['newPassword'] },
        updateCurrentAdminEmail:  { fn: updateCurrentAdminEmail, params: ['newEmail'] },
        updateCurrentAdminProfile:{ fn: updateCurrentAdminProfile, params: ['name'] },
        adminListAuthUsers:       { fn: adminListAuthUsers, params: [] },
        adminDeleteAuthUser:      { fn: adminDeleteAuthUser, params: ['uid'] },
        adminDisableUser:         { fn: adminDisableUser, params: ['uid'] },
        adminEnableUser:          { fn: adminEnableUser, params: ['uid'] },
        adminChangeUserPassword:  { fn: adminChangeUserPassword, params: ['uid', 'newPassword'] },
        adminChangeUserEmail:     { fn: adminChangeUserEmail, params: ['uid', 'newEmail'] },
        adminVerifyUserEmail:     { fn: adminVerifyUserEmail, params: ['uid'] },
        adminSetCustomClaims:     { fn: adminSetCustomClaims, params: ['uid', 'claims'] },
        adminGetUserInfo:         { fn: adminGetUserInfo, params: ['uid', 'email'] },
        adminRevokeUserTokens:    { fn: adminRevokeUserTokens, params: ['uid'] },
        adminUpdateDisplayName:   { fn: adminUpdateDisplayName, params: ['uid', 'displayName'] },
        adminGenerateCustomToken: { fn: adminGenerateCustomToken, params: ['uid'] },
        webSearch:                { fn: webSearch, params: ['query'] },
        browseWebUrl:             { fn: browseWebUrl, params: ['url'] },
        getHomepageConfig:        { fn: getHomepageConfig, params: [] },
        updateHomepageHero:       { fn: updateHomepageHero, params: ['imageUrl', 'titleVi', 'descVi'] },
        updateHomepageHeroImage:  { fn: updateHomepageHeroImage, params: ['imageUrl'] },
        updateHomepageHeroText:   { fn: updateHomepageHeroText, params: ['titleVi', 'titleEn', 'titleFi', 'descVi', 'descEn', 'descFi'] },
        updateHomepageSignatures: { fn: updateHomepageSignatures, params: ['dishIdArray'] },
        updateHomepageSignatureText: { fn: updateHomepageSignatureText, params: ['titleVi', 'titleEn', 'titleFi', 'descVi', 'descEn', 'descFi'] },
        updateHomepageStory:      { fn: updateHomepageStory, params: ['imageUrl', 'labelVi', 'titleVi', 'p1Vi', 'p2Vi'] },
        updateHomepageStoryImage: { fn: updateHomepageStoryImage, params: ['imageUrl'] },
        updateHomepageStoryText:  { fn: updateHomepageStoryText, params: ['labelVi', 'labelEn', 'labelFi', 'titleVi', 'titleEn', 'titleFi', 'p1Vi', 'p1En', 'p1Fi', 'p2Vi', 'p2En', 'p2Fi'] },
        updateHomepageCTA:        { fn: updateHomepageCTA, params: ['titleVi', 'titleEn', 'titleFi', 'descVi', 'descEn', 'descFi'] },
        getWheelGuarantee:        { fn: getWheelGuarantee, params: [] },
        updateWheelGuarantee:     { fn: updateWheelGuarantee, params: ['next20', 'next50', 'next100'] },
        updateHomepageReviews:    { fn: updateHomepageReviews, params: ['reviews'] },
        updateReviewImageUrl:     { fn: updateReviewImageUrl, params: ['index', 'imageUrl'] },
        sendEmail:                { fn: sendEmail, params: ['to', 'subject', 'html'] },
        updateUserLoyaltyPoints:  { fn: updateUserLoyaltyPoints, params: ['uidOrEmail', 'pointsAmount', 'isRelative'] },
        updateUserRank:           { fn: updateUserRank, params: ['uidOrEmail', 'targetRank'] },
        updateUserTotalSpent:     { fn: updateUserTotalSpent, params: ['uidOrEmail', 'totalSpentAmount', 'isRelative'] },
        listAllReservations:      { fn: listAllReservations, params: [] },
        createReservation:        { fn: createReservation, params: ['name', 'phone', 'email', 'date', 'time', 'guests', 'location', 'notes'] },
        updateReservationStatus:  { fn: updateReservationStatus, params: ['id', 'status'] },
        deleteReservation:        { fn: deleteReservation, params: ['id'] },
        listAllFeedbacks:         { fn: listAllFeedbacks, params: [] },
        replyToFeedback:          { fn: replyToFeedback, params: ['id', 'replyText'] },
        deleteFeedback:           { fn: deleteFeedback, params: ['id'] },
        updateVoucher:            { fn: updateVoucher, params: ['code', 'discountPercent', 'email', 'expiryDays', 'allowedTypes'] }
    };

    const KNOWN_TOOLS = new Set(Object.keys(toolRegistry));

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
                appendBubble("Hệ thống: Phát hiện nguy cơ lập gọi công cừ vô hạn. AI đã dừng lại.", 'ai');
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
                    progressBubbleEl.textContent = `Hệ thống: Đang thực hiện ${i+1}/${toolCalls.length} (${tool})... (OK: ${successCount}, Lỗi: ${failCount})`;
                }
                let result;
                try {
                    const entry = toolRegistry[tool];
                    if (!entry) { result = { error: `Tool "${tool}" không tồn tại.` }; }
                    else {
                        // Resolve attached image placeholders
                        let resolvedArgs = { ...args };
                        
                        const extractAttachedImageId = (str) => {
                            if (typeof str !== 'string') return null;
                            const match = str.match(/ATTACHED_IMAGE_[0-9_]+/);
                            return match ? match[0] : null;
                        };

                        // Scan and resolve all arguments containing ATTACHED_IMAGE_ placeholders
                        for (const key in resolvedArgs) {
                            if (typeof resolvedArgs[key] === 'string') {
                                const imgId = extractAttachedImageId(resolvedArgs[key]);
                                if (imgId && window.__uploadedImages && window.__uploadedImages[imgId]) {
                                    resolvedArgs[key] = window.__uploadedImages[imgId];
                                }
                            }
                        }

                        if (resolvedArgs.storyImg && !resolvedArgs.imageUrl) resolvedArgs.imageUrl = resolvedArgs.storyImg;
                        if (resolvedArgs.image && !resolvedArgs.imageUrl) resolvedArgs.imageUrl = resolvedArgs.image;
                        if (resolvedArgs.imgUrl && !resolvedArgs.imageUrl) resolvedArgs.imageUrl = resolvedArgs.imgUrl;
                        if (resolvedArgs.storyImageUrl && !resolvedArgs.imageUrl) resolvedArgs.imageUrl = resolvedArgs.storyImageUrl;
                        if (resolvedArgs.heroBgUrl && !resolvedArgs.imageUrl) resolvedArgs.imageUrl = resolvedArgs.heroBgUrl;
                        // Handle alternative arg names the AI might use
                        if (resolvedArgs.dishIds && !resolvedArgs.dishIdArray) resolvedArgs.dishIdArray = resolvedArgs.dishIds;
                        if (resolvedArgs.dishIdList && !resolvedArgs.dishIdArray) resolvedArgs.dishIdArray = resolvedArgs.dishIdList;
                        if (resolvedArgs.dishes && !resolvedArgs.dishIdArray) resolvedArgs.dishIdArray = resolvedArgs.dishes;
                        if (resolvedArgs.categoryId && !resolvedArgs.categoryVi) resolvedArgs.categoryVi = resolvedArgs.categoryId;
                        if (resolvedArgs.newCategoryId && !resolvedArgs.categoryVi) resolvedArgs.categoryVi = resolvedArgs.newCategoryId;
                        if (resolvedArgs.name && !resolvedArgs.nameVi) resolvedArgs.nameVi = resolvedArgs.name;
                        if (resolvedArgs.category && !resolvedArgs.categoryVi) resolvedArgs.categoryVi = resolvedArgs.category;
                        if (resolvedArgs.customFieldsObject && !resolvedArgs.customFields) resolvedArgs.customFields = resolvedArgs.customFieldsObject;
                        if (resolvedArgs.optionName && !resolvedArgs.optionNameVi) resolvedArgs.optionNameVi = resolvedArgs.optionName;
                        if (resolvedArgs.choiceLabel && !resolvedArgs.choiceLabelVi) resolvedArgs.choiceLabelVi = resolvedArgs.choiceLabel;
                        if ((resolvedArgs.uid || resolvedArgs.email) && !resolvedArgs.uidOrEmail) resolvedArgs.uidOrEmail = resolvedArgs.uid || resolvedArgs.email;
                        if (resolvedArgs.points && !resolvedArgs.pointsAmount) resolvedArgs.pointsAmount = resolvedArgs.points;
                        if (resolvedArgs.points_amount && !resolvedArgs.pointsAmount) resolvedArgs.pointsAmount = resolvedArgs.points_amount;
                        if (resolvedArgs.rank && !resolvedArgs.targetRank) resolvedArgs.targetRank = resolvedArgs.rank;
                        if (resolvedArgs.tier && !resolvedArgs.targetRank) resolvedArgs.targetRank = resolvedArgs.tier;
                        if (resolvedArgs.totalSpent && !resolvedArgs.totalSpentAmount) resolvedArgs.totalSpentAmount = resolvedArgs.totalSpent;
                        if (resolvedArgs.spent && !resolvedArgs.totalSpentAmount) resolvedArgs.totalSpentAmount = resolvedArgs.spent;
                        if (resolvedArgs.spent_amount && !resolvedArgs.totalSpentAmount) resolvedArgs.totalSpentAmount = resolvedArgs.spent_amount;
                        if (resolvedArgs.totalSpentAmount && !resolvedArgs.totalSpentAmount) resolvedArgs.totalSpentAmount = resolvedArgs.totalSpentAmount;
                        if (resolvedArgs.title && !resolvedArgs.titleVi) resolvedArgs.titleVi = resolvedArgs.title;
                        if (resolvedArgs.desc && !resolvedArgs.descVi) resolvedArgs.descVi = resolvedArgs.desc;
                        if (resolvedArgs.description && !resolvedArgs.descVi) resolvedArgs.descVi = resolvedArgs.description;
                        if (resolvedArgs.descriptionVi && !resolvedArgs.descVi) resolvedArgs.descVi = resolvedArgs.descriptionVi;
                        if (resolvedArgs.descriptionEn && !resolvedArgs.descEn) resolvedArgs.descEn = resolvedArgs.descriptionEn;
                        if (resolvedArgs.descriptionFi && !resolvedArgs.descFi) resolvedArgs.descFi = resolvedArgs.descriptionFi;
                        
                        // Normalizations for trilingual inputs (snake_case/alternative to camelCase)
                        if (resolvedArgs.title_vi && !resolvedArgs.titleVi) resolvedArgs.titleVi = resolvedArgs.title_vi;
                        if (resolvedArgs.title_en && !resolvedArgs.titleEn) resolvedArgs.titleEn = resolvedArgs.title_en;
                        if (resolvedArgs.title_fi && !resolvedArgs.titleFi) resolvedArgs.titleFi = resolvedArgs.title_fi;
                        if (resolvedArgs.desc_vi && !resolvedArgs.descVi) resolvedArgs.descVi = resolvedArgs.desc_vi;
                        if (resolvedArgs.desc_en && !resolvedArgs.descEn) resolvedArgs.descEn = resolvedArgs.desc_en;
                        if (resolvedArgs.desc_fi && !resolvedArgs.descFi) resolvedArgs.descFi = resolvedArgs.desc_fi;
                        if (resolvedArgs.description_vi && !resolvedArgs.descVi) resolvedArgs.descVi = resolvedArgs.description_vi;
                        if (resolvedArgs.description_en && !resolvedArgs.descEn) resolvedArgs.descEn = resolvedArgs.description_en;
                        if (resolvedArgs.description_fi && !resolvedArgs.descFi) resolvedArgs.descFi = resolvedArgs.description_fi;
                        
                        if (resolvedArgs.label_vi && !resolvedArgs.labelVi) resolvedArgs.labelVi = resolvedArgs.label_vi;
                        if (resolvedArgs.label_en && !resolvedArgs.labelEn) resolvedArgs.labelEn = resolvedArgs.label_en;
                        if (resolvedArgs.label_fi && !resolvedArgs.labelFi) resolvedArgs.labelFi = resolvedArgs.label_fi;
                        if (resolvedArgs.p1_vi && !resolvedArgs.p1Vi) resolvedArgs.p1Vi = resolvedArgs.p1_vi;
                        if (resolvedArgs.p1_en && !resolvedArgs.p1En) resolvedArgs.p1En = resolvedArgs.p1_en;
                        if (resolvedArgs.p1_fi && !resolvedArgs.p1Fi) resolvedArgs.p1Fi = resolvedArgs.p1_fi;
                        if (resolvedArgs.p2_vi && !resolvedArgs.p2Vi) resolvedArgs.p2Vi = resolvedArgs.p2_vi;
                        if (resolvedArgs.p2_en && !resolvedArgs.p2En) resolvedArgs.p2En = resolvedArgs.p2_en;
                        if (resolvedArgs.p2_fi && !resolvedArgs.p2Fi) resolvedArgs.p2Fi = resolvedArgs.p2_fi;
                        // Dispatch with correct positional args based on param list
                        const orderedArgs = entry.params.map(p => resolvedArgs[p]);
                        result = await entry.fn(...orderedArgs);
                    }
                } catch (err) { result = { error: err.message }; }
                if (result && typeof result === 'object' && result.error) { results.push({ tool, success: false, error: result.error }); failCount++; }
                else { results.push({ tool, success: true, result }); successCount++; }
            }

            const summaryHeader = `[KẾT QUẢ THỰC THI]:\n- Tổng: ${toolCalls.length}\n- Thành công: ${successCount}\n- Thất bại: ${failCount}\n\n`;
            const feedbackContent = results.map((r, idx) => `[KQ ${idx+1} - ${r.tool}]:\n${r.success ? JSON.stringify(r.result) : r.error}`).join('\n\n');
            chatMessages.push({ role: 'user', content: `Kết quả thỹc thi:\n\n${summaryHeader}${feedbackContent}\n\nHãy tổng hợp cho user bằng Tiếng Việt.` });
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
                } catch (cerebrasBackupErr) {
                    try {
                        console.log('[AI Chat] Cerebras failed. Trying Google Gemini...');
                        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer AQ.Ab8RN6I93QG9VviMo41jUgFhmXI0MWkk_FYMcOhdlXpPR-yVfg', 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: 'gemini-2.5-flash-lite', messages: chatMessages })
                        });
                        if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
                        data = await response.json();
                        console.log('[AI Chat] Google Gemini success.');
                    } catch (geminiErr) {
                        console.warn('[AI Chat] Gemini failed. Falling back to OpenRouter...', geminiErr.message);
                        const payload = { model: 'nex-agi/nex-n2-pro:free', messages: chatMessages };
                        data = await callOpenRouterWithFallback(payload);
                    }
                }
            }
            const responseText = data.choices[0].message.content;
            chatMessages.push({ role: 'assistant', content: responseText });
            await handleAgentResponse(responseText);
        } catch (err) {
            removeLoadingBubble();
            appendBubble(`Lỗi kết nối AI: ${err.message}`, 'ai');
        }
    }

    async function sendMessage() {
        const val = chatInput.value.trim();
        if (!val && (!window.__currentAttachments || window.__currentAttachments.length === 0)) return;
        chatInput.value = '';
        
        // Build the message user sees (only text + a clean list of filenames for UX)
        let displayMsg = val;
        if (window.__currentAttachments && window.__currentAttachments.length > 0) {
            const listNames = window.__currentAttachments.map(a => a.name).join(', ');
            displayMsg += (displayMsg ? '\n' : '') + `📎 [Đính kèm: ${listNames}]`;
        }
        appendBubble(displayMsg, 'user');
        
        // Build the actual message sent to AI
        let messageToSend = val;
        if (window.__currentAttachments && window.__currentAttachments.length > 0) {
            for (const att of window.__currentAttachments) {
                if (att.type === 'image') {
                    // Save base64 to global window.__uploadedImages for the tool executor to resolve later
                    window.__uploadedImages = window.__uploadedImages || {};
                    window.__uploadedImages[att.id] = att.content;
                    messageToSend += `\n[Ảnh đính kèm: ${att.id}]`;
                } else {
                    // Documents: append text content so the AI can read
                    messageToSend += `\n[Nội dung file đính kèm ${att.name}:\n${att.content}]`;
                }
            }
        }
        
        chatMessages.push({ role: 'user', content: messageToSend });
        
        // Clear attachments
        window.__currentAttachments = [];
        renderAttachmentsPreview();
        
        toolCallCount = 0;
        appendLoadingBubble();
        await fetchAiResponse();
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
})();
