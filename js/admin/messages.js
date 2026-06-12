import { db, auth } from "../firebase-config.js";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800 text-sm hover:bg-surface-highlight/30 transition-colors';

            tr.innerHTML = `
                <td class="py-3 px-4 font-medium text-white">${data.title}</td>
                <td class="py-3 px-4">${data.recipientId === 'all' ? 'Broadcast' : data.recipientId}</td>
                <td class="py-3 px-4">${data.imageUrl ? `<a href="${data.imageUrl}" target="_blank">Image</a>` : '-'}</td>
                <td class="py-3 px-4">${data.voucherCode || '-'}</td>
                <td class="py-3 px-4 text-xs text-secondary">${dateStr}</td>
                <td class="py-3 px-4">
                    <button onclick="window.deleteMessage('${docSnap.id}')" class="text-red-400 hover:text-red-300 p-1.5 rounded transition-colors" title="Delete">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
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

window.sendMessage = async () => {
    const title = document.getElementById('msg-title')?.value?.trim();
    const text = document.getElementById('msg-text')?.value?.trim();
    const recipientId = document.getElementById('msg-recipient')?.value;
    const imageUrl = document.getElementById('msg-image-url')?.value?.trim();
    const attachVoucher = document.getElementById('attach-voucher-check')?.checked;
    const attachSpin = document.getElementById('attach-spin-check')?.checked;

    if (!title || !text) {
        window.showNotification("Please fill subject and content.", "error");
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
            payload.voucherCode = "WELCOME" + Math.floor(100000 + Math.random() * 900000);
        }

        await addDoc(collection(db, "messages"), payload);

        if (attachSpin && recipientId && recipientId !== 'all') {
            const userRef = doc(db, "users", recipientId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const spins = userSnap.data().spins || { deu: 0, xin: 0, vip: 0 };
                await updateDoc(userRef, {
                    spins: {
                        deu: (spins.deu || 0) + 1,
                        xin: spins.xin || 0,
                        vip: spins.vip || 0
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
    const title = document.getElementById('msg-title');
    const text = document.getElementById('msg-text');
    const url = document.getElementById('msg-image-url');
    if (title) title.value = '';
    if (text) text.value = '';
    if (url) url.value = '';
    const v = document.getElementById('attach-voucher-check');
    const s = document.getElementById('attach-spin-check');
    if (v) v.checked = false;
    if (s) s.checked = false;
};

window.saveDraft = () => {
    window.showNotification("Draft saved locally.", "success");
};

window.scheduleSendAction = () => {
    window.showNotification("Scheduling not implemented in this view.", "error");
};

renderMessages();
loadRecipients();
