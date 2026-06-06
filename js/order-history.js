import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const container = document.getElementById('orders-tracking-container');

function formatTime(dateObj) {
    if (!dateObj) return 'N/A';
    const d = new Date(dateObj);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
}

// Global list of order IDs we are tracking
let trackedOrderIds = new Set();
let unsubscribers = [];

// Load orders from localStorage
const localOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
localOrders.forEach(id => trackedOrderIds.add(id));

// Handle state changes
onAuthStateChanged(auth, (user) => {
    // Clear previous listeners
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];
    
    if (user && user.email) {
        // Authenticated users: fetch user's own orders dynamically
        const q = collection(db, "orders");
        const unsub = onSnapshot(q, (snapshot) => {
            let userOrders = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data.customerEmail === user.email || data.userId === user.uid) {
                    userOrders.push({ id: docSnap.id, ...data });
                }
            });
            
            // Merge local storage orders too
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (trackedOrderIds.has(docSnap.id) && !userOrders.some(o => o.id === docSnap.id)) {
                    userOrders.push({ id: docSnap.id, ...data });
                }
            });

            renderTrackingCards(userOrders);
        });
        unsubscribers.push(unsub);
    } else {
        // Guest users: track orders stored in localStorage
        if (trackedOrderIds.size === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12 text-secondary">
                        <span class="material-symbols-outlined text-6xl mb-4 opacity-40">receipt_long</span>
                        <p class="text-lg">Chưa có đơn hàng nào được đặt.</p>
                        <a href="menu.html" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">Đặt hàng ngay</a>
                    </div>
                `;
            }
            return;
        }

        const q = collection(db, "orders");
        const unsub = onSnapshot(q, (snapshot) => {
            let activeLocalOrders = [];
            snapshot.forEach(docSnap => {
                if (trackedOrderIds.has(docSnap.id)) {
                    activeLocalOrders.push({ id: docSnap.id, ...docSnap.data() });
                }
            });
            renderTrackingCards(activeLocalOrders);
        });
        unsubscribers.push(unsub);
    }
});

function renderTrackingCards(orders) {
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `
            <p class="text-secondary text-center py-12">Chưa có đơn hàng nào cần theo dõi.</p>
        `;
        return;
    }

    // Sort by date newest first
    orders.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return tB - tA;
    });

    container.innerHTML = '';

    orders.forEach(order => {
        const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || 0);
        const dateStr = formatTime(orderDate);
        const card = document.createElement('div');
        card.className = "bg-surface-highlight/40 border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl";

        // Status mapping and classes
        const statusSteps = ['pending', 'cooking', 'ready', 'completed'];
        const stepLabelsVi = {
            'pending': 'Đã nhận đơn',
            'cooking': 'Đang chuẩn bị',
            'ready': 'Sẵn sàng giao',
            'completed': 'Hoàn tất'
        };
        const stepLabelsEn = {
            'pending': 'Pending',
            'cooking': 'Preparing',
            'ready': 'Ready',
            'completed': 'Completed'
        };
        
        const currentIdx = statusSteps.indexOf(order.status);
        const isCancelled = order.status === 'cancelled';

        // Items summary list
        const itemsHtml = (order.items || []).map(i => `
            <div class="flex justify-between items-center text-sm py-1">
                <span class="text-white/80"><span class="font-semibold text-primary mr-1">${i.qty}x</span> ${i.name}</span>
                <span class="text-secondary font-medium">€${(i.price * i.qty).toFixed(2)}</span>
            </div>
        `).join('');

        // Progress timeline builder
        let timelineHtml = '';
        if (isCancelled) {
            timelineHtml = `
                <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                    <span class="material-symbols-outlined">cancel</span>
                    <div>
                        <p class="font-bold">ĐƠN HÀNG ĐÃ HỦY / ORDER CANCELLED</p>
                        <p class="text-xs text-red-300/80">Đơn hàng này đã bị hủy bỏ bởi nhà hàng hoặc khách hàng.</p>
                    </div>
                </div>
            `;
        } else {
            const stepsHtml = statusSteps.map((step, idx) => {
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                
                let dotClass = "w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ";
                if (isCurrent) {
                    dotClass += "bg-primary border-primary text-white shadow-lg shadow-primary/30 ring-4 ring-primary/20 scale-110";
                } else if (isPassed) {
                    dotClass += "bg-green-500/20 border-green-500 text-green-400";
                } else {
                    dotClass += "bg-surface border-white/10 text-secondary";
                }

                const icon = isPassed && !isCurrent ? '<span class="material-symbols-outlined text-sm">check</span>' : idx + 1;
                const labelVi = stepLabelsVi[step];
                const labelEn = stepLabelsEn[step];

                return `
                    <div class="flex flex-col items-center flex-1 text-center min-w-[70px] relative z-10">
                        <div class="${dotClass}">${icon}</div>
                        <div class="mt-3">
                            <p class="font-bold text-xs md:text-sm ${isCurrent ? 'text-primary' : isPassed ? 'text-green-400' : 'text-secondary'}">${labelVi}</p>
                            <p class="text-[10px] text-secondary/60 mt-0.5">${labelEn}</p>
                        </div>
                    </div>
                `;
            }).join('');

            // Background connector line
            let progressPercentage = 0;
            if (currentIdx > 0) {
                progressPercentage = (currentIdx / (statusSteps.length - 1)) * 100;
            }

            timelineHtml = `
                <div class="relative py-4">
                    <div class="absolute top-8 left-8 right-8 h-0.5 bg-white/5 -translate-y-1/2 z-0">
                        <div class="h-full bg-gradient-to-r from-green-500 to-primary transition-all duration-500" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="flex justify-between items-start">
                        ${stepsHtml}
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <!-- Card Header -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/5 pb-4 gap-3">
                <div>
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">receipt_long</span>
                        <span>Mã đơn: #${order.id.substring(0, 8).toUpperCase()}</span>
                    </h3>
                    <p class="text-xs text-secondary mt-1">${dateStr}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="capitalize text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 font-semibold text-white/90">
                        ${order.orderType === 'dine-in' ? `Ăn tại bàn (Bàn ${order.tableNumber})` : order.orderType === 'delivery' ? 'Giao hàng' : 'Mang về'}
                    </span>
                    <span class="text-xl font-bold text-primary">€${order.totalPrice.toFixed(2)}</span>
                </div>
            </div>

            <!-- Items -->
            <div class="bg-black/20 rounded-xl p-4 divide-y divide-white/5">
                ${itemsHtml}
            </div>

            <!-- Timeline -->
            ${timelineHtml}
            
            <!-- Notes -->
            ${order.notes ? `
                <div class="bg-yellow-500/5 border border-yellow-500/20 text-yellow-200/90 text-xs rounded-xl p-4 italic">
                    <strong>Ghi chú:</strong> ${order.notes}
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}
