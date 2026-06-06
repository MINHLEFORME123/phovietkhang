import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc, 
    updateDoc, 
    arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const messagesList = document.getElementById('messages-list');
const detailsPanel = document.getElementById('details-panel-container');
const unreadCountBadge = document.getElementById('unread-count-badge');
const inboxBadgeNav = document.getElementById('inbox-badge-nav');

let activeUser = null;
let currentMessages = [];
let selectedMessage = null;

const inboxTranslations = {
    vi: {
        emptyTitle: "Hộp thư của bạn trống.",
        copy: "Sao chép",
        copied: "Đã chép",
        attachedVoucher: "Voucher Đính Kèm",
        hint: "💡 Nhập mã trên tại trang thanh toán của bạn để được áp dụng giảm giá.",
        orderNow: "Đặt món ngay"
    },
    en: {
        emptyTitle: "Your mailbox is empty.",
        copy: "Copy",
        copied: "Copied",
        attachedVoucher: "Attached Voucher",
        hint: "💡 Enter the above code at checkout to apply discount.",
        orderNow: "Order now"
    },
    fi: {
        emptyTitle: "Postilaatikkosi on tyhjä.",
        copy: "Kopioi",
        copied: "Kopioitu",
        attachedVoucher: "Liitetty etukuponki",
        hint: "💡 Syötä yllä oleva koodi kassalla saadaksesi alennuksen.",
        orderNow: "Tilaa heti"
    }
};

// Format Date Utility
function formatMsgDate(timestamp) {
    if (!timestamp) return '';
    const d = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Check if message is read
function isMsgRead(msg, uid) {
    if (msg.recipientId === 'all') {
        return Array.isArray(msg.readBy) && msg.readBy.includes(uid);
    }
    return msg.read === true;
}

// Mark Message as Read in Firestore
async function markAsRead(msg) {
    if (!activeUser) return;
    const msgRef = doc(db, "messages", msg.id);
    try {
        if (msg.recipientId === 'all') {
            if (!Array.isArray(msg.readBy) || !msg.readBy.includes(activeUser.uid)) {
                await updateDoc(msgRef, {
                    readBy: arrayUnion(activeUser.uid)
                });
            }
        } else {
            if (msg.read !== true) {
                await updateDoc(msgRef, {
                    read: true
                });
            }
        }
    } catch (err) {
        console.error("Error marking message as read:", err);
    }
}

// Render Left Panel Message List
function renderMessageList(uid) {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = inboxTranslations[lang] || inboxTranslations.en;

    if (currentMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="text-center py-12 text-secondary">
                <span class="material-symbols-outlined text-4xl mb-2">inbox</span>
                <p class="text-sm">${t.emptyTitle}</p>
            </div>
        `;
        unreadCountBadge.classList.add('hidden');
        if (inboxBadgeNav) inboxBadgeNav.classList.add('hidden');
        return;
    }

    messagesList.innerHTML = '';
    let unreadCount = 0;

    currentMessages.forEach(msg => {
        const read = isMsgRead(msg, uid);
        if (!read) unreadCount++;

        const card = document.createElement('button');
        card.className = `w-full text-left p-4 rounded-xl border border-white/5 bg-surface hover:bg-white/5 transition-all flex flex-col gap-1 border-l-4 ${read ? 'border-l-transparent opacity-80' : 'border-l-primary font-semibold'}`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <h3 class="text-sm text-white line-clamp-1">${msg.title}</h3>
                ${!read ? '<span class="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5"></span>' : ''}
            </div>
            <p class="text-xs text-secondary line-clamp-2">${msg.text}</p>
            <span class="text-[10px] text-secondary/60 mt-1">${formatMsgDate(msg.createdAt)}</span>
        `;

        card.addEventListener('click', () => {
            selectedMessage = msg;
            renderMessageDetails(msg);
            markAsRead(msg);
        });

        messagesList.appendChild(card);
    });

    // Handle Unread Badges
    if (unreadCount > 0) {
        unreadCountBadge.textContent = unreadCount;
        unreadCountBadge.classList.remove('hidden');
        if (inboxBadgeNav) inboxBadgeNav.classList.remove('hidden');
    } else {
        unreadCountBadge.classList.add('hidden');
        if (inboxBadgeNav) inboxBadgeNav.classList.add('hidden');
    }
}

// Render Right Panel Message Details
function renderMessageDetails(msg) {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = inboxTranslations[lang] || inboxTranslations.en;

    let mediaHtml = '';
    if (msg.imageUrl) {
        mediaHtml = `
            <div class="relative w-full h-48 rounded-xl overflow-hidden mb-4 border border-white/10">
                <img src="${msg.imageUrl}" class="w-full h-full object-cover">
            </div>
        `;
    }

    let voucherHtml = '';
    if (msg.voucherCode) {
        const codes = msg.voucherCode.split(',').map(c => c.trim()).filter(Boolean);
        const codesListHtml = codes.map(code => `
            <div class="flex items-center justify-between gap-4 bg-background border border-primary/20 p-3 rounded-xl select-all font-mono text-primary font-bold text-lg">
                <span>${code}</span>
                <button onclick="window.copyVoucherToClipboard('${code}', this)" class="bg-primary/20 hover:bg-primary/30 border border-primary/30 text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-primary">
                    <span class="material-symbols-outlined text-[14px]">content_copy</span>${t.copy}
                </button>
            </div>
        `).join('');

        voucherHtml = `
            <div class="bg-primary/5 border border-primary/10 rounded-2xl p-4 mt-6">
                <h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">local_activity</span>
                    ${t.attachedVoucher}
                </h4>
                <div class="space-y-2">
                    ${codesListHtml}
                </div>
                <p class="text-[11px] text-secondary mt-3 italic text-center">${t.hint}</p>
            </div>
        `;
    }

    detailsPanel.innerHTML = `
        <div class="h-full flex flex-col justify-between">
            <div class="flex-1 overflow-y-auto pr-1">
                <!-- Header -->
                <div class="border-b border-white/10 pb-4 mb-6">
                    <span class="text-xs text-secondary">${formatMsgDate(msg.createdAt)}</span>
                    <h2 class="text-2xl font-bold text-white font-['EB_Garamond'] mt-1">${msg.title}</h2>
                </div>

                <!-- Media -->
                ${mediaHtml}

                <!-- Body Text -->
                <p class="text-sm text-secondary/90 leading-relaxed whitespace-pre-wrap">${msg.text}</p>

                <!-- Voucher -->
                ${voucherHtml}
            </div>

            <!-- Action -->
            <div class="border-t border-white/10 pt-4 mt-6 flex justify-end">
                <a href="menu.html" class="px-6 py-2.5 bg-primary hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">restaurant</span> ${t.orderNow}
                </a>
            </div>
        </div>
    `;
}

// Global Clipboard Copy Action Helper
window.copyVoucherToClipboard = function(code, btn) {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = inboxTranslations[lang] || inboxTranslations.en;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="material-symbols-outlined text-[14px]">done</span>${t.copied}`;
        btn.classList.replace('bg-primary/20', 'bg-green-500/20');
        btn.classList.replace('text-primary', 'text-green-400');
        btn.classList.replace('border-primary/30', 'border-green-500/30');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.replace('bg-green-500/20', 'bg-primary/20');
            btn.classList.replace('text-green-400', 'text-primary');
            btn.classList.replace('border-green-500/30', 'border-primary/30');
        }, 1500);
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
    });
};

// Language listener to refresh UI
window.addEventListener('languageChanged', () => {
    if (activeUser) {
        renderMessageList(activeUser.uid);
        if (selectedMessage) {
            renderMessageDetails(selectedMessage);
        }
    }
});

// Listen to Auth state and load real-time database query snapshots
onAuthStateChanged(auth, user => {
    if (user) {
        activeUser = user;
        
        // Listen to messages (recipient === 'all' OR recipient === user.uid)
        const q = query(
            collection(db, "messages"),
            where("recipientId", "in", ["all", user.uid])
        );

        onSnapshot(q, (snapshot) => {
            const list = [];
            snapshot.forEach(docSnap => {
                list.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });

            // Sort newest first
            list.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                return dateB - dateA;
            });

            currentMessages = list;
            renderMessageList(user.uid);
        });

    } else {
        // Kick guest users out to login page
        window.location.href = "login.html";
    }
});
