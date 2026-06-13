import { db } from "../firebase-config.js";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDocs,
    getDoc,
    addDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ensureAdminNotification } from "./utils.js";

ensureAdminNotification();

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function createCell(className, html = '') {
    const td = document.createElement('td');
    td.className = className || '';
    if (html) td.innerHTML = html;
    return td;
}

function renderMessages() {
    const tableBody = document.getElementById('messages-table-body');
    if (!tableBody) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-secondary">No messages found.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let dateStr = '';
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                dateStr = data.createdAt.toDate().toLocaleString();
            } else if (data.createdAt) {
                dateStr = new Date(data.createdAt).toLocaleString();
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800 text-sm hover:bg-surface-highlight/30 transition-colors';

            const title = data.title || 'Untitled';
            const recipient = data.recipientId === 'all' ? 'Broadcast' : data.recipientId || 'Unknown';
            const imageHtml = data.imageUrl ? `<a href="${escapeHtml(data.imageUrl)}" target="_blank" rel="noopener noreferrer">Image</a>` : '-';
            const voucher = data.voucherCode || '-';

            tr.appendChild(createCell('py-3 px-4 font-medium text-white', escapeHtml(title)));
            tr.appendChild(createCell('py-3 px-4', escapeHtml(recipient)));
            tr.appendChild(createCell('py-3 px-4', imageHtml));
            tr.appendChild(createCell('py-3 px-4', escapeHtml(voucher)));
            tr.appendChild(createCell('py-3 px-4 text-xs text-secondary', escapeHtml(dateStr)));

            const actionsTd = document.createElement('td');
            actionsTd.className = 'py-3 px-4';
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'text-red-400 hover:text-red-300 p-1.5 rounded transition-colors';
            deleteBtn.title = 'Delete';
            deleteBtn.innerHTML = '<span class="material-symbols-outlined text-sm">delete</span>';
            deleteBtn.addEventListener('click', () => window.deleteMessage(docSnap.id));
            actionsTd.appendChild(deleteBtn);
            tr.appendChild(actionsTd);

            tableBody.appendChild(tr);
        });
    }, (error) => {
        console.error("Failed to load messages:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Failed to load messages. Check Firestore index/permissions.</td></tr>';
    });
}

window.deleteMessage = async (id) => {
    if (!confirm("Delete this message?")) return;
    try {
        await deleteDoc(doc(db, "messages", id));
        window.showNotification("Message deleted.", "success");
    } catch (e) {
        console.error(e);
        window.showNotification("Delete failed.", "error");
    }
};

async function loadRecipients() {
    const select = document.getElementById('msg-recipient');
    if (!select) return;
    try {
        select.innerHTML = '<option value="all">Tất cả khách hàng (Broadcast)</option>';
        const snap = await getDocs(collection(db, "users"));
        snap.forEach((d) => {
            const data = d.data();
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = data.name || data.email || d.id;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error("Failed to load users:", e);
    }
}

function setupMessageToggles() {
    const voucherCheck = document.getElementById('attach-voucher-check');
    const spinCheck = document.getElementById('attach-spin-check');
    const voucherSection = document.getElementById('voucher-config-section');
    const spinSection = document.getElementById('spin-config-section');

    const sync = () => {
        if (voucherSection) voucherSection.classList.toggle('hidden', !voucherCheck?.checked);
        if (spinSection) spinSection.classList.toggle('hidden', !spinCheck?.checked);
    };

    voucherCheck?.addEventListener('change', sync);
    spinCheck?.addEventListener('change', sync);
    sync();
}

window.sendMessage = async (event) => {
    if (event) event.preventDefault();

    const title = document.getElementById('msg-title')?.value?.trim();
    const text = document.getElementById('msg-text')?.value?.trim();
    const recipientId = document.getElementById('msg-recipient')?.value || 'all';
    const imageUrl = document.getElementById('msg-image-url')?.value?.trim();
    const attachVoucher = document.getElementById('attach-voucher-check')?.checked;
    const attachSpin = document.getElementById('attach-spin-check')?.checked;

    if (!title || !text) {
        window.showNotification("Please fill subject and content.", "error");
        return;
    }

    if (attachSpin && recipientId === 'all') {
        window.showNotification("Tặng lượt quay chỉ áp dụng cho một khách hàng cụ thể, không áp dụng broadcast.", "error");
        return;
    }

    try {
        const payload = {
            title,
            text,
            recipientId,
            imageUrl,
            createdAt: new Date(),
            read: false
        };

        if (attachVoucher) {
            const parsedDiscount = parseInt(document.getElementById('voucher-percent')?.value || '10', 10);
            const discountPercent = Number.isFinite(parsedDiscount) ? parsedDiscount : 10;
            const duration = document.getElementById('voucher-duration')?.value || '30';
            const allowedOrderTypes = [];
            if (document.getElementById('voucher-type-dine-in')?.checked) allowedOrderTypes.push('dine-in');
            if (document.getElementById('voucher-type-takeaway')?.checked) allowedOrderTypes.push('takeaway');
            if (document.getElementById('voucher-type-delivery')?.checked) allowedOrderTypes.push('delivery');

            const code = `WELCOME${discountPercent}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
            const parsedDuration = parseInt(duration, 10);
            let expiryDate = null;
            if (duration !== 'never' && Number.isFinite(parsedDuration)) {
                expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + parsedDuration);
            }

            await setDoc(doc(db, "vouchers", code), {
                code,
                discountPercent,
                email: recipientId === 'all' ? '' : recipientId,
                used: false,
                allowedOrderTypes,
                expiryDate,
                createdAt: new Date()
            });

            payload.voucherCode = code;
            payload.voucherDiscountPercent = discountPercent;
            payload.voucherExpiryDate = expiryDate;
        }

        await addDoc(collection(db, "messages"), payload);

        if (attachSpin && recipientId && recipientId !== 'all') {
            const spinType = document.getElementById('spin-type-select')?.value || 'deu';
            const parsedCount = parseInt(document.getElementById('spin-count-input')?.value || '1', 10);
            const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 1;
            const userRef = doc(db, "users", recipientId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const spins = userSnap.data().spins || { deu: 0, xin: 0, vip: 0 };
                await updateDoc(userRef, {
                    spins: {
                        deu: (spins.deu || 0) + (spinType === 'deu' ? count : 0),
                        xin: (spins.xin || 0) + (spinType === 'xin' ? count : 0),
                        vip: (spins.vip || 0) + (spinType === 'vip' ? count : 0)
                    }
                });
            }
        }

        window.showNotification("Message sent.", "success");
        if (window.resetMessageForm) window.resetMessageForm();
    } catch (e) {
        console.error(e);
        window.showNotification("Failed to send.", "error");
    }
};

window.resetMessageForm = () => {
    const form = document.getElementById('message-compose-form');
    if (form) form.reset();

    const title = document.getElementById('msg-title');
    const text = document.getElementById('msg-text');
    const url = document.getElementById('msg-image-url');
    if (title) title.value = '';
    if (text) text.value = '';
    if (url) url.value = '';

    const voucherCheck = document.getElementById('attach-voucher-check');
    const spinCheck = document.getElementById('attach-spin-check');
    if (voucherCheck) voucherCheck.checked = false;
    if (spinCheck) spinCheck.checked = false;
    setupMessageToggles();
};

window.saveDraft = () => {
    window.showNotification("Draft saved locally.", "success");
};

window.scheduleSendAction = () => {
    window.showNotification("Scheduling not implemented in this view.", "error");
};

const messageForm = document.getElementById('message-compose-form');
if (messageForm) {
    messageForm.addEventListener('submit', window.sendMessage);
}

renderMessages();
loadRecipients();
setupMessageToggles();
