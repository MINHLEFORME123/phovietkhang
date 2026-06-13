import { db } from "../firebase-config.js";
import { collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { formatOrderDate, getOrderTimeAlert } from "./utils.js";

let revenueChartInstance = null;
let typeChartInstance = null;

const dashboardContainer = document.getElementById('dashboard-container');
if (!dashboardContainer) {
    // Not on dashboard page - skip
} else {
    const escapeHtml = (value) => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    initDashboard();
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

async function initDashboard() {
    try {
        const menuSnap = await getDocs(collection(db, "menu"));
        const statProductsEl = document.getElementById('stat-products');
        if (statProductsEl) statProductsEl.textContent = menuSnap.size;
    } catch(e) {
        console.error("Error loading menu stats:", e);
    }

    onSnapshot(collection(db, "orders"), (snapshot) => {
        let todayRevenue = 0;
        let activeCount = 0;
        let completedTodayCount = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last7Days = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            last7Days[key] = 0;
        }

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
                id: orderId, date: orderDate, completedAt: completedDate,
                customerName: data.customerName || 'Guest',
                totalPrice: Number(data.totalPrice) || 0, status: data.status || 'pending',
                orderType: data.orderType || 'takeaway', items: Array.isArray(data.items) ? data.items : []
            });

            if (orderDate >= today) {
                if (data.status !== 'cancelled') todayRevenue += Number(data.totalPrice) || 0;
                if (['pending', 'cooking', 'ready'].includes(data.status)) activeCount++;
                if (data.status === 'completed') completedTodayCount++;
            }

            const dateKey = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (last7Days.hasOwnProperty(dateKey) && data.status !== 'cancelled') {
                last7Days[dateKey] += Number(data.totalPrice) || 0;
            }

            const t = (data.orderType || 'takeaway').toLowerCase();
            if (typesCount.hasOwnProperty(t)) typesCount[t]++;
        });

        const statRevEl = document.getElementById('stat-revenue');
        if (statRevEl) statRevEl.textContent = todayRevenue.toFixed(2) + '€';
        const statActEl = document.getElementById('stat-active');
        if (statActEl) statActEl.textContent = activeCount;
        const statCompEl = document.getElementById('stat-completed');
        if (statCompEl) statCompEl.textContent = completedTodayCount;

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
                    const safeOrderId = String(order.id || '').substring(0, 5).toUpperCase();
                    const customerName = escapeHtml(order.customerName || 'Guest');
                    const itemsText = order.items.map(i => `${i.name || ''} (x${i.qty || 0})`).join(', ');
                    const safeItemsText = escapeHtml(itemsText);

                    tr.innerHTML = `
                        <td class="py-3 px-4 font-mono text-primary font-medium">#${safeOrderId}</td>
                        <td class="py-3 px-4">
                            <div class="text-secondary">${dateString}</div>
                            <div class="text-[10px] text-${timeAlert.color}-400 font-semibold mt-0.5">${timeAlert.label}</div>
                        </td>
                        <td class="py-3 px-4">${customerName}</td>
                        <td class="py-3 px-4 max-w-[200px] truncate" title="${safeItemsText}">${safeItemsText}</td>
                        <td class="py-3 px-4 text-green-400 font-medium">${escapeHtml(order.totalPrice.toFixed(2))}€</td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-${badgeColor}-500/10 text-${badgeColor}-400 border border-${badgeColor}-500/20">${escapeHtml(order.status)}</span>
                        </td>
                    `;
                    recentBody.appendChild(tr);
                });
            }
        }

        // Revenue trend chart
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
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { grid: { color: '#1e293b' }, ticks: { color: '#9ca3af' } },
                            x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                        }
                    }
                });
            }
        }

        // Order type chart
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
                            legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 12 } }
                        }
                    }
                });
            }
        }
    }, (error) => {
        console.error("Error loading dashboard orders:", error);
        const recentBody = document.getElementById('recent-orders-table-body');
        if (recentBody) recentBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-500">Failed to load orders.</td></tr>';
    });
}
