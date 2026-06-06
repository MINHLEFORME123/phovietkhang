import { db } from "./firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const loadingEl = document.getElementById('tracking-loading');
const contentEl = document.getElementById('tracking-content');

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

const trackingTranslations = {
    vi: {
        trackFailed: "THEO DÕI THẤT BẠI",
        backToMenu: "Quay lại thực đơn",
        noOrderId: "Không tìm thấy mã đơn hàng cần theo dõi trong liên kết.",
        notFound: (id) => `Đơn hàng #${id} không tồn tại hoặc đã bị xóa.`,
        systemError: "Lỗi hệ thống khi tải thông tin đơn hàng.",
        dineIn: (table) => `Ăn tại bàn (Bàn ${table})`,
        delivery: "Giao hàng",
        takeaway: "Mang về",
        trackTitle: (id) => `Theo dõi đơn hàng: #${id}`,
        itemsTitle: "Danh sách món ăn",
        notesTitle: "Ghi chú đơn hàng:",
        cancelledTitle: "ĐƠN HÀNG ĐÃ HỦY",
        cancelledDesc: "Đơn hàng này đã bị hủy bỏ. Vui lòng liên hệ nhà hàng để biết thêm chi tiết.",
        steps: {
            'pending': 'Đã nhận đơn',
            'cooking': 'Đang chuẩn bị',
            'ready': 'Sẵn sàng giao',
            'completed': 'Hoàn tất'
        }
    },
    en: {
        trackFailed: "TRACKING FAILED",
        backToMenu: "Back to Menu",
        noOrderId: "Order ID not found in the link.",
        notFound: (id) => `Order #${id} does not exist or has been deleted.`,
        systemError: "System error while loading order details.",
        dineIn: (table) => `Dine-in (Table ${table})`,
        delivery: "Delivery",
        takeaway: "Takeaway",
        trackTitle: (id) => `Track Order: #${id}`,
        itemsTitle: "Items Ordered",
        notesTitle: "Order Notes:",
        cancelledTitle: "ORDER CANCELLED",
        cancelledDesc: "This order has been cancelled. Please contact the restaurant for details.",
        steps: {
            'pending': 'Order Received',
            'cooking': 'Preparing',
            'ready': 'Ready',
            'completed': 'Completed'
        }
    },
    fi: {
        trackFailed: "SEURANTA EPÄONNISTUI",
        backToMenu: "Takaisin ruokalistaan",
        noOrderId: "Tilaustunnusta ei löytynyt linkistä.",
        notFound: (id) => `Tilausta #${id} ei ole olemassa tai se on poistettu.`,
        systemError: "Järjestelmävirhe tilaustietoja ladattaessa.",
        dineIn: (table) => `Syö paikan päällä (Pöytä ${table})`,
        delivery: "Kotiinkuljetus",
        takeaway: "Mukaan",
        trackTitle: (id) => `Seuraa tilausta: #${id}`,
        itemsTitle: "Tilatut tuotteet",
        notesTitle: "Tilauksen lisätiedot:",
        cancelledTitle: "TILAUS PERUUTETTU",
        cancelledDesc: "Tämä tilaus on peruutettu. Ota yhteyttä ravintolaan lisätietoja varten.",
        steps: {
            'pending': 'Tilaus vastaanotettu',
            'cooking': 'Valmistellaan',
            'ready': 'Valmis',
            'completed': 'Valmis'
        }
    }
};

let currentOrderUnsubscribe = null;

function initTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = trackingTranslations[lang] || trackingTranslations.en;

    if (!orderId) {
        showError(t.noOrderId);
        return;
    }

    if (currentOrderUnsubscribe) {
        currentOrderUnsubscribe();
    }

    currentOrderUnsubscribe = onSnapshot(doc(db, "orders", orderId), (docSnap) => {
        if (!docSnap.exists()) {
            showError(t.notFound(orderId.toUpperCase()));
            return;
        }

        const order = docSnap.data();
        renderOrderProgress(docSnap.id, order);
    }, (error) => {
        console.error("Error loading order:", error);
        showError(t.systemError);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTracking);
} else {
    initTracking();
}

function showError(message) {
    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = trackingTranslations[lang] || trackingTranslations.en;

    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) {
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = `
            <div class="text-center py-8 space-y-4">
                <div class="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
                    <span class="material-symbols-outlined text-4xl">error</span>
                </div>
                <h3 class="text-xl font-bold text-white">${t.trackFailed}</h3>
                <p class="text-secondary text-sm">${message}</p>
                <a href="menu.html" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">${t.backToMenu}</a>
            </div>
        `;
    }
}

function renderOrderProgress(id, order) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (!contentEl) return;

    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const t = trackingTranslations[lang] || trackingTranslations.en;

    contentEl.classList.remove('hidden');

    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt || 0);
    const dateStr = formatTime(orderDate);

    // Status steps configuration
    const statusSteps = ['pending', 'cooking', 'ready', 'completed'];
    const currentIdx = statusSteps.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    // Items list HTML
    const itemsHtml = (order.items || []).map(i => {
        const itemDisplayName = lang === 'vi' ? i.nameVi : (lang === 'fi' ? i.nameFi : i.nameEn);
        const nameToShow = itemDisplayName || i.name || 'Unknown';
        return `
            <div class="flex justify-between items-center text-sm py-1.5">
                <span class="text-white/80"><span class="font-semibold text-primary mr-1">${i.qty}x</span> ${nameToShow}</span>
                <span class="text-secondary font-semibold">€${(i.price * i.qty).toFixed(2)}</span>
            </div>
        `;
    }).join('');

    // Timeline component builder
    let timelineHtml = '';
    if (isCancelled) {
        timelineHtml = `
            <div class="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center gap-4 text-sm">
                <span class="material-symbols-outlined text-3xl">cancel</span>
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
            
            let dotClass = "w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm transition-all duration-300 ";
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

        let progressPercentage = 0;
        if (currentIdx > 0) {
            progressPercentage = (currentIdx / (statusSteps.length - 1)) * 100;
        }

        timelineHtml = `
            <div class="relative py-4">
                <div class="absolute top-9 left-8 right-8 h-0.5 bg-white/5 -translate-y-1/2 z-0">
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

    contentEl.innerHTML = `
        <!-- Card Header -->
        <div class="flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/10 pb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-2 font-['EB_Garamond']">
                    <span class="material-symbols-outlined text-primary text-2xl">receipt_long</span>
                    <span>${t.trackTitle(id.substring(0, 8).toUpperCase())}</span>
                </h2>
                <p class="text-xs text-secondary mt-1">${dateStr}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="capitalize text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 font-semibold text-white/90">
                    ${orderTypeLabel}
                </span>
                <span class="text-2xl font-bold text-primary">€${order.totalPrice.toFixed(2)}</span>
            </div>
        </div>

        <!-- Timeline -->
        <div class="py-4">
            ${timelineHtml}
        </div>

        <!-- Items Summary -->
        <div class="space-y-3 pt-4 border-t border-white/10">
            <h4 class="text-sm font-semibold text-white uppercase tracking-wider">${t.itemsTitle}</h4>
            <div class="bg-black/20 rounded-xl p-4 divide-y divide-white/5 border border-white/5">
                ${itemsHtml}
            </div>
        </div>
        
        <!-- Notes -->
        ${order.notes ? `
            <div class="bg-yellow-500/5 border border-yellow-500/20 text-yellow-200/90 text-xs rounded-xl p-4 italic">
                <strong>${t.notesTitle}</strong> ${order.notes}
            </div>
        ` : ''}

        <!-- Back to Menu button -->
        <div class="pt-6 text-center">
            <a href="menu.html" class="inline-flex items-center gap-2 text-primary hover:text-white transition-colors text-sm font-semibold">
                <span class="material-symbols-outlined text-sm">arrow_back</span>
                <span>${t.backToMenu}</span>
            </a>
        </div>
    `;
}

window.addEventListener('languageChanged', () => {
    initTracking();
});
