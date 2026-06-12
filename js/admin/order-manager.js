import { db } from "../firebase-config.js";
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { formatOrderDate, getOrderTimeAlert, callWorker } from "./utils.js";

const container = document.getElementById('order-manager-container');
if (!container) {
    // Not on order manager page
} else {
    let currentFilter = 'all';
    let searchQuery = '';
    let allOrders = [];

    const detailModal = document.getElementById('order-detail-modal');
    let currentModalOrderId = null;
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

    window.setFilter = function(filter) {
        currentFilter = filter;
        document.querySelectorAll('.status-tab-btn').forEach(btn => {
            if (btn.getAttribute('onclick').includes(filter)) {
                btn.className = "status-tab-btn px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-primary/20 text-primary text-white";
            } else {
                btn.className = "status-tab-btn px-4 py-1.5 rounded-md text-sm font-medium text-secondary hover:text-white transition-all";
            }
        });
        renderOrders();
    };

    window.viewOrderDetails = function(orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;
        currentModalOrderId = orderId;
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

        modalOrderItems.innerHTML = '';
        order.items.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800/30 text-white text-xs";
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
                <td class="py-2 px-3 text-right font-medium">${(item.price * item.qty).toFixed(2)}â‚¬</td>
            `;
            modalOrderItems.appendChild(tr);
        });

        if (order.notes) {
            modalNotesBlock.classList.remove('hidden');
            modalNotesText.textContent = order.notes;
        } else {
            modalNotesBlock.classList.add('hidden');
        }

        modalTotalPrice.textContent = order.totalPrice.toFixed(2) + 'â‚¬';
        detailModal.classList.remove('hidden');
    };

    window.closeOrderModal = function() {
        detailModal.classList.add('hidden');
    };

    window.deleteCurrentOrder = function() {
        if (!currentModalOrderId) return;
        window.deleteOrder(currentModalOrderId);
        window.closeOrderModal();
    };

    window.changeStatus = async function(orderId, newStatus) {
        try {
            const updateData = { status: newStatus };
            if (newStatus === 'completed') {
                updateData.completedAt = new Date();
            }
            await updateDoc(doc(db, "orders", orderId), updateData);

            if (newStatus === 'ready') {
                const order = allOrders.find(o => o.id === orderId);
                if (order && order.customerEmail) {
                    const orderLang = order.language || 'en';
                    const readyTranslations = {
                        vi: {
                            subject: `[Phá»Ÿ Viá»‡t Khang] ÄÆ¡n hÃ ng cá»§a báº¡n Ä‘Ã£ sáºµn sÃ ng! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "ÄÆ N HÃ€NG ÄÃƒ Sáº´N SÃ€NG",
                            intro: `Xin chÃ o <strong>${order.customerName || 'QuÃ½ khÃ¡ch'}</strong>,<br><br>Tin vui! ÄÆ¡n hÃ ng cá»§a báº¡n táº¡i Phá»Ÿ Viá»‡t Khang Ä‘Ã£ Ä‘Æ°á»£c cháº¿ biáº¿n xong vÃ  sáºµn sÃ ng phá»¥c vá»¥.`,
                            summaryHeader: "Chi tiáº¿t Ä‘Æ¡n hÃ ng:",
                            totalLabel: "Tá»•ng cá»™ng",
                            serviceType: "HÃ¬nh thá»©c",
                            orderId: "MÃ£ Ä‘Æ¡n hÃ ng",
                            footer: "Cáº£m Æ¡n quÃ½ khÃ¡ch Ä‘Ã£ á»§ng há»™ nhÃ  hÃ ng. Phá»Ÿ Viá»‡t Khang Â© 2026."
                        },
                        en: {
                            subject: `[Phá»Ÿ Viá»‡t Khang] Your Order is Ready! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "YOUR ORDER IS READY",
                            intro: `Hi <strong>${order.customerName || 'Customer'}</strong>,<br><br>Great news! Your order at Phá»Ÿ Viá»‡t Khang is ready and waiting for you.`,
                            summaryHeader: "Here is a summary of your order:",
                            totalLabel: "Total Price",
                            serviceType: "Service Type",
                            orderId: "Order ID",
                            footer: "Thank you for dining with us! Phá»Ÿ Viá»‡t Khang Â© 2026."
                        },
                        fi: {
                            subject: `[Phá»Ÿ Viá»‡t Khang] Tilauksesi on valmis! - #${orderId.substring(0, 8).toUpperCase()}`,
                            title: "TILAUKSESI ON VALMIS",
                            intro: `Hei <strong>${order.customerName || 'Asiakas'}</strong>,<br><br>Hienoja uutisia! Tilauksesi Phá»Ÿ Viá»‡t Khangissa on valmis ja odottaa sinua.`,
                            summaryHeader: "TÃ¤ssÃ¤ on yhteenveto tilauksestasi:",
                            totalLabel: "YhteensÃ¤",
                            serviceType: "Palvelutyyppi",
                            orderId: "Tilaustunnus",
                            footer: "Kiitos asioinnistasi kanssamme! Phá»Ÿ Viá»‡t Khang Â© 2026."
                        }
                    };
                    const rData = readyTranslations[orderLang] || readyTranslations['en'];
                    const itemsHtml = (order.items || []).map(i => `<li style="margin-bottom: 5px;"><strong>${i.qty}x</strong> ${i.name}</li>`).join('');
                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                            <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">${rData.title}</h2>
                            <p>${rData.intro}</p>
                            <p><strong>${rData.summaryHeader}</strong></p>
                            <ul style="padding-left: 20px; margin: 15px 0;">${itemsHtml}</ul>
                            <p style="font-size: 1.1em;"><strong>${rData.totalLabel}:</strong> <span style="color: #10b981; font-weight: bold;">${(order.totalPrice || 0).toFixed(2)}â‚¬</span></p>
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

    window.deleteOrder = async function(orderId) {
        if (!confirm("Are you sure you want to permanently delete this order?")) return;
        try {
            await deleteDoc(doc(db, "orders", orderId));
        } catch(e) {
            console.error("Error deleting order:", e);
            window.showNotification("Failed to delete order.", 'error');
        }
    };

    window.clearAllOrders = async function() {
        if (!confirm("Delete ALL orders? This cannot be undone!")) return;
        const qSnap = await getDocs(collection(db, "orders"));
        const batch = [];
        qSnap.forEach(docSnap => batch.push(deleteDoc(docSnap.ref)));
        await Promise.all(batch);
        window.showNotification(`Deleted ${batch.length} orders.`, 'success');
    };

    function renderOrders() {
        const tableBody = document.getElementById('orders-table-body');
        const mobileBody = document.getElementById('orders-table-body-mobile');
        if (!tableBody && !mobileBody) return;

        const filtered = allOrders.filter(order => {
            const matchesStatus = currentFilter === 'all' || order.status === currentFilter;
            const matchesSearch = order.id.toLowerCase().includes(searchQuery) ||
                (order.customerName || '').toLowerCase().includes(searchQuery) ||
                (order.customerPhone || '').toLowerCase().includes(searchQuery);
            return matchesStatus && matchesSearch;
        });

        if (filtered.length === 0) {
            if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-secondary">No orders found.</td></tr>';
            if (mobileBody) mobileBody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-secondary">No orders found.</td></tr>';
            return;
        }

        filtered.forEach(order => {
            const statusBadge = order.emailConfirmed === false
                ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">Chá» email</span>`
                : `<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-${(() => { if (order.status === 'pending') return 'red'; if (['cooking','preparing'].includes(order.status)) return 'yellow'; if (order.status === 'ready') return 'blue'; if (order.status === 'completed') return 'green'; return 'gray'; })()}-500/10 text-${(() => { if (order.status === 'pending') return 'red'; if (['cooking','preparing'].includes(order.status)) return 'yellow'; if (order.status === 'ready') return 'blue'; if (order.status === 'completed') return 'green'; return 'gray'; })()}-400 border border-${(() => { if (order.status === 'pending') return 'red'; if (['cooking','preparing'].includes(order.status)) return 'yellow'; if (order.status === 'ready') return 'blue'; if (order.status === 'completed') return 'green'; return 'gray'; })()}-500/20">${order.status}</span>`;

            if (tableBody) {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors text-sm text-white";
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
                    <td class="py-3.5 px-4 text-green-400 font-semibold">${order.totalPrice.toFixed(2)}â‚¬</td>
                    <td class="py-3.5 px-4">${statusBadge}</td>
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
            }

            if (mobileBody) {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-800/50 hover:bg-surface-highlight transition-colors text-white";
                tr.innerHTML = `
                    <td class="py-2 px-2 text-[11px] font-mono text-primary font-medium">#${order.id.substring(0, 6).toUpperCase()}</td>
                    <td class="py-2 px-2 text-[11px] font-medium">${order.customerName || 'Guest'}</td>
                    <td class="py-2 px-2 text-[11px] text-green-400 font-semibold">${order.totalPrice.toFixed(2)}â‚¬</td>
                    <td class="py-2 px-2">${statusBadge}</td>
                    <td class="py-2 px-2">
                        <div class="flex items-center gap-1">
                            <button onclick="window.viewOrderDetails('${order.id}')" class="p-1 hover:bg-surface-highlight text-primary rounded">
                                <span class="material-symbols-outlined text-base">visibility</span>
                            </button>
                            <button onclick="window.deleteOrder('${order.id}')" class="p-1 hover:bg-red-500/10 text-red-400 rounded">
                                <span class="material-symbols-outlined text-base">delete</span>
                            </button>
                        </div>
                    </td>
                `;
                mobileBody.appendChild(tr);
            }
        });
    }

    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderOrders();
        });
    }

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
            allOrders.push({ ...data, id: docSnap.id, createdAt: date });
        });
        allOrders.sort((a, b) => b.createdAt - a.createdAt);
        renderOrders();
    });

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('admin-sidebar');
    if (sidebarToggle && sidebar && sidebarOverlay) {
        const closeSidebar = () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        };
        sidebarToggle.addEventListener('click', () => {
            const opening = !sidebar.classList.contains('open');
            if (opening) {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('open');
            } else {
                closeSidebar();
            }
        });
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
}
