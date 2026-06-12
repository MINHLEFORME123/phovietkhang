import { db } from "../firebase-config.js";
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

function renderFeedback() {
    const grid = document.getElementById('feedback-grid');
    if (!grid) return;

    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        grid.innerHTML = '';
        if (snapshot.empty) {
            grid.innerHTML = '<div class="col-span-full text-center text-secondary py-10">No feedback messages found.</div>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let dateStr = '';
            if (data.createdAt && data.createdAt.toDate) {
                dateStr = data.createdAt.toDate().toLocaleString();
            }

            const card = document.createElement('div');
            card.className = `bg-surface-highlight/30 rounded-xl border ${data.status === 'unread' ? 'border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-gray-800'} p-5 flex flex-col relative`;

            card.innerHTML = `
                ${data.status === 'unread' ? '<div class="absolute top-4 right-4 w-3 h-3 bg-primary rounded-full animate-pulse"></div>' : ''}
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold uppercase">
                        ${data.name ? data.name.charAt(0) : '?'}
                    </div>
                    <div>
                        <h4 class="font-semibold text-white">${data.name || 'Anonymous'}</h4>
                        <p class="text-xs text-secondary">${dateStr}</p>
                    </div>
                </div>
                <div class="mb-4 text-sm text-gray-300 flex-1 bg-black/20 p-3 rounded-lg border border-white/5 break-words whitespace-pre-wrap">${data.message}</div>
                <div class="flex flex-col gap-1 mb-4 text-xs text-secondary">
                    <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[14px]">mail</span> <a href="mailto:${data.email}" class="hover:text-primary transition-colors">${data.email || 'N/A'}</a></div>
                    <div class="flex items-center gap-2"><span class="material-symbols-outlined text-[14px]">call</span> ${data.phone || 'N/A'}</div>
                </div>
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                    ${data.status === 'unread' ?
                        `<button onclick="window.markRead('${docSnap.id}')" class="text-xs font-medium text-primary hover:text-blue-400 flex items-center gap-1 transition-colors"><span class="material-symbols-outlined text-[16px]">mark_email_read</span> Mark as Read</button>` :
                        `<span class="text-xs text-secondary flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">done_all</span> Read</span>`
                    }
                    <button onclick="window.deleteFeedback('${docSnap.id}')" class="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">delete</span> Delete
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

window.markRead = async (id) => {
    try {
        await updateDoc(doc(db, "feedback", id), { status: 'read' });
        if (window.showNotification) window.showNotification("Feedback marked as read.", "success");
    } catch (e) {
        console.error(e);
        if (window.showNotification) window.showNotification("Failed to update feedback.", "error");
    }
};

window.deleteFeedback = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
        await deleteDoc(doc(db, "feedback", id));
        if (window.showNotification) window.showNotification("Feedback deleted.", "success");
    } catch (e) {
        console.error(e);
        if (window.showNotification) window.showNotification("Failed to delete feedback.", "error");
    }
};

renderFeedback();
