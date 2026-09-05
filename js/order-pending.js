import { db } from "./firebase-config.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const loadingEl = document.getElementById('pending-loading');
const contentEl = document.getElementById('pending-content');

const I18N = {
    vi: {
        loadingOrder: 'Đang tải thông tin đơn hàng...',
        cancelledTitle: 'RẤT TIẾC, ĐƠN HÀNG ĐÃ BỊ HỦY',
        cancelledBody: (idShort) => `Nhà hàng không thể nhận đơn #${idShort} vào lúc này do quá tải hoặc hết nguyên liệu. Chúng tôi đã gửi email xin lỗi tới bạn — bạn sẽ không bị tính phí. Mong quý khách thông cảm!`,
        backToMenu: 'Quay lại thực đơn',
        oosTitle: 'MỘT SỐ MÓN TẠM HẾT',
        oosBody: (idShort) => `Rất tiếc, một vài món trong đơn #${idShort} hiện đã hết. Bạn có thể sửa lại đơn hàng (bớt món hết hàng hoặc đổi số lượng hoặc thêm món mới) — đơn sẽ được gửi lại cho nhà hàng xác nhận ngay. Chúng tôi cũng đã gửi email hướng dẫn cho bạn.`,
        editOrderBtn: 'Sửa lại đơn hàng',
        confirmedTitle: 'NHÀ HÀNG ĐÃ XÁC NHẬN ĐƠN CỦA BẠN!',
        redirecting: 'Đang chuyển bạn tới trang theo dõi đơn hàng...',
        awaitingTitle: 'ĐANG CHỜ NHÀ HÀNG XÁC NHẬN',
        awaitingBody: (idShort) => `Đơn #${idShort} đã được gửi tới nhà hàng. Vui lòng giữ trang này mở — bạn sẽ được chuyển tự động ngay khi nhà hàng xác nhận (thường chỉ mất vài phút).`,
        totalLabel: 'Tổng cộng',
        errorTitle: 'KHÔNG TẢI ĐƯỢC ĐƠN HÀNG',
        errorMissingId: 'Không tìm thấy mã đơn hàng trong liên kết.',
        errorNotFound: (orderId) => `Đơn hàng #${orderId.toUpperCase()} không tồn tại hoặc đã bị xóa.`,
        errorSystem: 'Lỗi hệ thống khi tải thông tin đơn hàng.'
    },
    en: {
        loadingOrder: 'Loading order information...',
        cancelledTitle: 'ORDER CANCELLED',
        cancelledBody: (idShort) => `Unfortunately, the restaurant had to cancel your order #${idShort} due to high demand or low ingredient stock. A detailed email has been sent to you. You will not be charged. We apologize for the inconvenience!`,
        backToMenu: 'Back to Menu',
        oosTitle: 'SOME ITEMS ARE UNAVAILABLE',
        oosBody: (idShort) => `Unfortunately, some dishes in order #${idShort} are out of stock. You can edit your order (remove unavailable dishes, adjust quantities, or add new dishes) — it will be resubmitted to the restaurant for confirmation immediately. We have also emailed you instructions.`,
        editOrderBtn: 'Edit Order',
        confirmedTitle: 'ORDER CONFIRMED BY RESTAURANT!',
        redirecting: 'Redirecting you to the order tracking page...',
        awaitingTitle: 'WAITING FOR CONFIRMATION',
        awaitingBody: (idShort) => `Order #${idShort} has been sent to the restaurant. Please keep this page open — you will be redirected automatically once the restaurant confirms (usually takes only a few minutes).`,
        totalLabel: 'Total',
        errorTitle: 'COULD NOT LOAD ORDER',
        errorMissingId: 'No order ID found in the link.',
        errorNotFound: (orderId) => `Order #${orderId.toUpperCase()} does not exist or has been deleted.`,
        errorSystem: 'System error loading order details.'
    },
    fi: {
        loadingOrder: 'Ladataan tilaustietoja...',
        cancelledTitle: 'TILAUS PERUUTETTU',
        cancelledBody: (idShort) => `Valitettavasti ravintola joutui peruuttamaan tilauksesi #${idShort} suuren kysynnän tai raaka-aineiden loppumisen vuoksi. Sinulle on lähetetty sähköposti. Sinua ei veloiteta. Pahoittelemme tilannetta!`,
        backToMenu: 'Takaisin ruokalistaan',
        oosTitle: 'OSA ANNOKSISTA LOPPU',
        oosBody: (idShort) => `Valitettavasti jotkut annokset tilauksessa #${idShort} ovat loppuneet. Voit muokata tilaustasi (poistaa loppuneet annokset, muuttaa määriä tai lisätä uusia annoksia) — tilaus lähetetään heti uudelleen vahvistettavaksi. Olemme myös lähettäneet ohjeet sähköpostiisi.`,
        editOrderBtn: 'Muokkaa tilausta',
        confirmedTitle: 'RAVINTOLA ON VAHVISTANUT TILAUKSESI!',
        redirecting: 'Siirrytään tilauksen seurantasivulle...',
        awaitingTitle: 'ODOTTAA VAHVISTUSTA',
        awaitingBody: (idShort) => `Tilaus #${idShort} on lähetetty ravintolaan. Pidä tämä sivu auki — sinut siirretään seurantasivulle automaattisesti heti, kun ravintola vahvistaa tilauksen (kestää yleensä vain muutaman minuutin).`,
        totalLabel: 'Yhteensä',
        errorTitle: 'TILAUKSEN LATAAMINEN EPÄONNISTUI',
        errorMissingId: 'Tilaustunnusta ei löytynyt linkistä.',
        errorNotFound: (orderId) => `Tilausta #${orderId.toUpperCase()} ei ole olemassa tai se on poistettu.`,
        errorSystem: 'Järjestelmävirhe tilaustietoja ladattaessa.'
    },
    sv: {
        loadingOrder: 'Laddar beställningsinformation...',
        cancelledTitle: 'BESTÄLLNING AVBRUTEN',
        cancelledBody: (idShort) => `Tyvärr var restaurangen tvungen att avbryta din beställning #${idShort} på grund av hög efterfrågan eller råvarubrist. Vi har skickat ett e-postmeddelande till dig. Du debiteras ingenting. Vi ber om ursäkt för besväret!`,
        backToMenu: 'Tillbaka till menyn',
        oosTitle: 'VISSA ANNOKSER ÄR SLUT',
        oosBody: (idShort) => `Tyvärr är några rätter i beställning #${idShort} slutsålda. Du kan ändra din beställning (ta bort rätter som är slut, ändra antal eller lägga till nya rätter) — den skickas direkt tillbaka till restaurangen för bekräftelse. Vi har även skickat instruktioner via e-post.`,
        editOrderBtn: 'Ändra beställning',
        confirmedTitle: 'BESTÄLLNING BEKRÄFTAD AV RESTAURANGEN!',
        redirecting: 'Omdirigerar till beställningsspårning...',
        awaitingTitle: 'VÄNTAR PÅ BEKRÄFTELSE',
        awaitingBody: (idShort) => `Beställning #${idShort} har skickats till restaurangen. Vänligen håll denna sida öppen — du kommer att omdirigeras automatiskt så fort restaurangen bekräftar (brukar ta några minuter).`,
        totalLabel: 'Totalt',
        errorTitle: 'KUNDE INTE LADDA BESTÄLLNING',
        errorMissingId: 'Inget beställnings-ID hittades i länken.',
        errorNotFound: (orderId) => `Beställning #${orderId.toUpperCase()} existerar inte eller har raderats.`,
        errorSystem: 'Systemfel vid laddning av beställningsinformation.'
    }
};

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

let redirectTimer = null;
let currentOrder = null;
let currentOrderId = null;

function show(html) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) {
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = html;
    }
}

function itemsSummaryHtml(order, lang) {
    const rows = (order.items || []).map(i => {
        const displayName = (i.names && i.names[lang]) ? i.names[lang] : i.name;
        return `
            <div class="flex justify-between items-center text-sm py-1.5">
                <span class="text-white/80"><span class="font-semibold text-primary mr-1">${escapeHtml(i.qty)}x</span> ${escapeHtml(displayName)}</span>
                <span class="text-secondary font-semibold">€${((Number(i.price) || 0) * (Number(i.qty) || 0)).toFixed(2)}</span>
            </div>
        `;
    }).join('');
    return `
        <div class="bg-black/20 rounded-xl p-4 divide-y divide-white/5 border border-white/5 text-left">${rows}</div>
        <p class="text-right text-lg font-bold text-primary mt-3">${I18N[lang].totalLabel}: €${(Number(order.totalPrice) || 0).toFixed(2)}</p>`;
}

function renderState(orderId, order) {
    const orderLang = order.language || localStorage.getItem('selectedLanguage') || 'en';
    const lang = I18N[orderLang] ? orderLang : 'en';

    const idShort = orderId.substring(0, 8).toUpperCase();
    const confirmation = order.confirmation || 'confirmed';

    if (order.status === 'cancelled' || confirmation === 'cancelled') {
        show(`
            <div class="text-center py-8 space-y-4">
                <div class="mx-auto w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
                    <span class="material-symbols-outlined text-5xl">sentiment_dissatisfied</span>
                </div>
                <h3 class="text-xl font-bold text-white">${I18N[lang].cancelledTitle}</h3>
                <p class="text-secondary text-sm max-w-md mx-auto">${I18N[lang].cancelledBody(idShort)}</p>
                <a href="/" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">${I18N[lang].backToMenu}</a>
            </div>
        `);
        return;
    }

    if (confirmation === 'out_of_stock') {
        show(`
            <div class="text-center py-8 space-y-4">
                <div class="mx-auto w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-400">
                    <span class="material-symbols-outlined text-5xl">restaurant_menu</span>
                </div>
                <h3 class="text-xl font-bold text-white">${I18N[lang].oosTitle}</h3>
                <p class="text-secondary text-sm max-w-md mx-auto">${I18N[lang].oosBody(idShort)}</p>
                ${itemsSummaryHtml(order, lang)}
                <a href="order-edit?orderId=${encodeURIComponent(orderId)}" class="inline-flex items-center gap-2 mt-4 px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors">
                    <span class="material-symbols-outlined">edit</span>
                    <span>${I18N[lang].editOrderBtn}</span>
                </a>
            </div>
        `);
        return;
    }

    if (confirmation === 'confirmed') {
        show(`
            <div class="text-center py-8 space-y-4">
                <div class="mx-auto w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400">
                    <span class="material-symbols-outlined text-5xl">check_circle</span>
                </div>
                <h3 class="text-xl font-bold text-white">${I18N[lang].confirmedTitle}</h3>
                <p class="text-secondary text-sm">${I18N[lang].redirecting}</p>
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
            </div>
        `);
        if (!redirectTimer) {
            redirectTimer = setTimeout(() => {
                window.location.href = `order-tracking?orderId=${encodeURIComponent(orderId)}`;
            }, 1800);
        }
        return;
    }

    // 'awaiting'
    show(`
        <div class="text-center py-8 space-y-5">
            <div class="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-5xl animate-pulse">hourglass_top</span>
            </div>
            <h3 class="text-xl font-bold text-white">${I18N[lang].awaitingTitle}</h3>
            <p class="text-secondary text-sm max-w-md mx-auto">${I18N[lang].awaitingBody(idShort)}</p>
            <div class="flex justify-center">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
            ${itemsSummaryHtml(order, lang)}
        </div>
    `);
}

function showError(message, lang = 'en') {
    const errorTitle = I18N[lang] ? I18N[lang].errorTitle : I18N.en.errorTitle;
    const backToMenu = I18N[lang] ? I18N[lang].backToMenu : I18N.en.backToMenu;
    show(`
        <div class="text-center py-8 space-y-4">
            <div class="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
                <span class="material-symbols-outlined text-4xl">error</span>
            </div>
            <h3 class="text-xl font-bold text-white">${errorTitle}</h3>
            <p class="text-secondary text-sm">${message}</p>
            <a href="/" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">${backToMenu}</a>
        </div>
    `);
}

function init() {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const urlLang = localStorage.getItem('selectedLanguage') || 'en';
    const initialLang = I18N[urlLang] ? urlLang : 'en';

    if (!orderId) {
        showError(I18N[initialLang].errorMissingId, initialLang);
        return;
    }
    onSnapshot(doc(db, "orders", orderId), (snap) => {
        if (!snap.exists()) {
            showError(I18N[initialLang].errorNotFound(orderId), initialLang);
            return;
        }
        currentOrder = snap.data();
        currentOrderId = snap.id;
        renderState(currentOrderId, currentOrder);
    }, (err) => {
        console.error("Error loading order:", err);
        showError(I18N[initialLang].errorSystem, initialLang);
    });
}

window.addEventListener('languageChanged', () => {
    if (currentOrderId && currentOrder) {
        renderState(currentOrderId, currentOrder);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
