import { db } from "../firebase-config.js";
import { collection, doc, query, orderBy, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
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

function renderReservations() {
    const tableBody = document.getElementById('reservations-table-body');
    if (!tableBody) return;

    const q = query(collection(db, "reservations"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-secondary">No reservations found.</td></tr>';
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800 text-sm hover:bg-surface-highlight/30 transition-colors';

            let statusBadge = '';
            const status = escapeHtml(data.status || 'unknown');
            if (data.status === 'pending') statusBadge = '<span class="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold uppercase">Pending</span>';
            else if (data.status === 'confirmed') statusBadge = '<span class="bg-green-500/20 text-green-500 px-2 py-1 rounded text-xs font-bold uppercase">Confirmed</span>';
            else if (data.status === 'cancelled') statusBadge = '<span class="bg-red-500/20 text-red-500 px-2 py-1 rounded text-xs font-bold uppercase">Cancelled</span>';
            else statusBadge = `<span class="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs font-bold uppercase">${status}</span>`;

            tr.innerHTML = `
                <td class="py-3 px-4 font-medium text-white">
                    ${escapeHtml(data.name || 'N/A')}
                    ${data.notes ? `<p class="text-xs text-secondary mt-1 max-w-[200px] truncate" title="${escapeHtml(data.notes)}">📝 ${escapeHtml(data.notes)}</p>` : ''}
                </td>
                <td class="py-3 px-4">
                    <div>${escapeHtml(data.phone || '')}</div>
                    <div class="text-xs text-secondary">${escapeHtml(data.email || '')}</div>
                </td>
                <td class="py-3 px-4 font-medium text-white">${escapeHtml(data.date || '')} <br> <span class="text-primary">${escapeHtml(data.time || '')}</span></td>
                <td class="py-3 px-4">${escapeHtml(data.guests || '')} pax</td>
                <td class="py-3 px-4 uppercase text-xs font-bold tracking-wider">${escapeHtml(data.location || '')}</td>
                <td class="py-3 px-4">${statusBadge}</td>
                <td class="py-3 px-4">
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="window.updateRes('${docSnap.id}', 'confirmed')" class="text-green-400 hover:bg-green-500/20 p-1.5 rounded transition-colors" title="Confirm">
                            <span class="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button type="button" onclick="window.updateRes('${docSnap.id}', 'cancelled')" class="text-red-400 hover:bg-red-500/20 p-1.5 rounded transition-colors" title="Cancel">
                            <span class="material-symbols-outlined text-sm">close</span>
                        </button>
                        <button type="button" onclick="window.deleteRes('${docSnap.id}')" class="text-secondary hover:text-white hover:bg-gray-800 p-1.5 rounded transition-colors ml-2" title="Delete">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }, (error) => {
        console.error("Failed to load reservations:", error);
        tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-red-500">Failed to load reservations. Check Firestore permissions/index.</td></tr>';
    });
}

window.updateRes = async (id, status) => {
    try {
        await updateDoc(doc(db, "reservations", id), { status });
        window.showNotification(`Reservation marked as ${status}`, "success");
    } catch (e) {
        console.error(e);
    }
};

window.deleteRes = async (id) => {
    if (!confirm("Are you sure you want to delete this reservation permanently?")) return;
    try {
        await deleteDoc(doc(db, "reservations", id));
        window.showNotification("Reservation deleted.", "success");
    } catch (e) {
        console.error(e);
    }
};

renderReservations();
