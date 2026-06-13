import { db } from "../firebase-config.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { computeLoyaltyTier, listAllUsers } from "./utils.js";

const userTableBody = document.getElementById('user-table-body');
if (userTableBody) {
    const escapeHtml = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    async function loadUsers() {
        window.loadUsers = loadUsers;
        try {
            const result = await listAllUsers();
            if (result && result.error) throw new Error(result.error);
            userTableBody.innerHTML = '';
            if (!result || result.length === 0) {
                userTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-secondary">No users found.</td></tr>';
                return;
            }
            result.forEach((user) => {
                const totalSpent = Number(user.totalSpent || 0);
                const tier = computeLoyaltyTier(totalSpent);
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors";
                tr.innerHTML = `
                    <td class="py-3 px-4">${escapeHtml(user.name || 'N/A')}</td>
                    <td class="py-3 px-4">${escapeHtml(user.email || 'N/A')}</td>
                    <td class="py-3 px-4">
                        <select onchange="window.updateUserRole('${escapeHtml(user.uid)}', this.value)" class="bg-surface-highlight border border-gray-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2">
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="kitchen" ${user.role === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                            <option value="host" ${user.role === 'host' ? 'selected' : ''}>Host</option>
                        </select>
                    </td>
                    <td class="py-3 px-4 text-secondary text-sm">${totalSpent.toLocaleString('vi-VN')} đ</td>
                    <td class="py-3 px-4">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold" style="background:${tier.color}22; color:${tier.color}; border:1px solid ${tier.color}44;">
                            <span class="material-symbols-outlined text-[14px]" style="color:${tier.color}">${tier.icon}</span>
                            ${tier.labelVi}
                            ${tier.discountPercent > 0 ? `(−${tier.discountPercent}%)` : ''}
                        </span>
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error("Error loading users:", error);
            userTableBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-500">Failed to load users.</td></tr>';
        }
    }

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

    loadUsers();
}
