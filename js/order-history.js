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
let lastLoadedOrders = [];

const historyTranslations = {
    vi: {
        emptyTitle: "Chưa có đơn hàng nào được đặt.",
        orderNow: "Đặt hàng ngay",
        noTracking: "Chưa có đơn hàng nào cần theo dõi.",
        orderId: (id) => `Mã đơn: #${id}`,
        dineIn: (table) => `Ăn tại bàn (Bàn ${table})`,
        delivery: "Giao hàng",
        takeaway: "Mang về",
        notesTitle: "Ghi chú:",
        cancelledTitle: "ĐƠN HÀNG ĐÃ HỦY",
        cancelledDesc: "Đơn hàng này đã bị hủy bỏ bởi nhà hàng hoặc khách hàng.",
        steps: {
            'pending': 'Đã nhận đơn',
            'cooking': 'Đang chuẩn bị',
            'ready': 'Sẵn sàng giao',
            'completed': 'Hoàn tất'
        }
    },
    en: {
        emptyTitle: "No orders have been placed yet.",
        orderNow: "Order Now",
        noTracking: "No orders to track.",
        orderId: (id) => `Order ID: #${id}`,
        dineIn: (table) => `Dine-in (Table ${table})`,
        delivery: "Delivery",
        takeaway: "Takeaway",
        notesTitle: "Notes:",
        cancelledTitle: "ORDER CANCELLED",
        cancelledDesc: "This order has been cancelled by the restaurant or customer.",
        steps: {
            'pending': 'Order Received',
            'cooking': 'Preparing',
            'ready': 'Ready',
            'completed': 'Completed'
        }
    },
    fi: {
        emptyTitle: "Tilauksia ei ole vielä tehty.",
        orderNow: "Tilaa Nyt",
        noTracking: "Ei seurattavia tilauksia.",
        orderId: (id) => `Tilaustunnus: #${id}`,
        dineIn: (table) => `Syö paikan päällä (Pöytä ${table})`,
        delivery: "Kotiinkuljetus",
        takeaway: "Mukaan",
        notesTitle: "Lisätiedot:",
        cancelledTitle: "TILAUS PERUUTETTU",
        cancelledDesc: "Ravintola tai asiakas on peruuttanut tämän tilauksen.",
        steps: {
            'pending': 'Tilaus vastaanotettu',
            'cooking': 'Valmistellaan',
            'ready': 'Valmis',
            'completed': 'Valmis'
        }
    }
};

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

            lastLoadedOrders = userOrders;
            renderTrackingCards(userOrders);
        });
        unsubscribers.push(unsub);
    } else {
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        const t = historyTranslations[lang] || historyTranslations.en;

        // Guest users: track orders stored in localStorage
        if (trackedOrderIds.size === 0) {
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-12 text-secondary">
                        <span class="material-symbols-outlined text-6xl mb-4 opacity-40">receipt_long</span>
                        <p class="text-lg">${t.emptyTitle}</p>
                        <a href="menu.html" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">${t.orderNow}</a>
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
            lastLoadedOrders = activeLocalOrders;
            renderTrackingCards(activeLocalOrders);
        });
        unsubscribers.push(unsub);
    }
});

function renderTrackingCards(orders) {
    if (!container) return;

    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = historyTranslations[lang] || historyTranslations.en;

    if (orders.length === 0) {
        container.innerHTML = `
            <p class="text-secondary text-center py-12">${t.noTracking}</p>
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
        const itemsHtml = (order.items || []).map(i => {
            const itemDisplayName = lang === 'vi' ? i.nameVi : (lang === 'fi' ? i.nameFi : i.nameEn);
            const nameToShow = itemDisplayName || i.name || 'Unknown';
            return `
                <div class="flex justify-between items-center text-sm py-1">
                    <span class="text-white/80"><span class="font-semibold text-primary mr-1">${i.qty}x</span> ${nameToShow}</span>
                    <span class="text-secondary font-medium">€${(i.price * i.qty).toFixed(2)}</span>
                </div>
            `;
        }).join('');

        // Progress timeline builder
        let timelineHtml = '';
        if (isCancelled) {
            timelineHtml = `
                <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm">
                    <span class="material-symbols-outlined">cancel</span>
                    <div>
                        <p class="font-bold">${t.cancelledTitle}</p>
                        <p class="text-xs text-red-300/80">${t.cancelledDesc}</p>
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
                const labelText = t.steps[step];

                return `
                    <div class="flex flex-col items-center flex-1 text-center min-w-[70px] relative z-10">
                        <div class="${dotClass}">${icon}</div>
                        <div class="mt-3">
                            <p class="font-bold text-xs md:text-sm ${isCurrent ? 'text-primary' : isPassed ? 'text-green-400' : 'text-secondary'}">${labelText}</p>
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

        const orderTypeLabel = order.orderType === 'dine-in' 
            ? t.dineIn(order.tableNumber) 
            : (order.orderType === 'delivery' ? t.delivery : t.takeaway);

        card.innerHTML = `
            <!-- Card Header -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/5 pb-4 gap-3">
                <div>
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">receipt_long</span>
                        <span>${t.orderId(order.id.substring(0, 8).toUpperCase())}</span>
                    </h3>
                    <p class="text-xs text-secondary mt-1">${dateStr}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="capitalize text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 font-semibold text-white/90">
                        ${orderTypeLabel}
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
                    <strong>${t.notesTitle}</strong> ${order.notes}
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

// Refresh when language changes
window.addEventListener('languageChanged', () => {
    renderTrackingCards(lastLoadedOrders);
});
