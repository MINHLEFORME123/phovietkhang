import { db } from "./firebase-config.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';

const loadingEl = document.getElementById('edit-loading');
const contentEl = document.getElementById('edit-content');

const I18N = {
    vi: {
        errorTitle: 'KHÔNG SỬA ĐƯỢC ĐƠN HÀNG',
        errorMissingId: 'Không tìm thấy mã đơn hàng trong liên kết.',
        errorNotFound: (orderId) => `Đơn hàng #${orderId.toUpperCase()} không tồn tại hoặc đã bị xóa.`,
        errorSystem: 'Lỗi hệ thống khi tải thông tin đơn hàng.',
        subtotal: 'Tạm tính',
        deliveryFee: 'Phí giao hàng',
        discount: (percent) => `Giảm giá (${percent}%)`,
        total: 'Tổng cộng',
        title: (idShort) => `SỬA LẠI ĐƠN HÀNG #${idShort}`,
        description: 'Hãy bỏ món đã hết, đổi số lượng, hoặc chọn thêm món mới từ thực đơn bên dưới. Sau đó gửi lại để nhà hàng xác nhận.',
        emptyOrderWarning: 'Đơn hàng phải còn ít nhất 1 món. Nếu bạn không muốn giữ món nào, hãy để nhà hàng hủy đơn.',
        btnResubmit: 'Gửi lại đơn cho nhà hàng',
        btnResubmitting: 'Đang gửi lại...',
        errorNotEditable: 'Đơn này không còn ở trạng thái chỉnh sửa (có thể nhà hàng đã xử lý). Vui lòng tải lại trang.',
        errorFailedResubmit: 'Không gửi lại được đơn. Vui lòng thử lại hoặc liên hệ nhà hàng.',
        errorItemOos: '⚠️ Có món trong đơn vừa mới hết hàng. Vui lòng kiểm tra lại.',
        badgeOos: 'Hết món',
        oosSectionHeader: 'Món hết hàng (đã tự động bỏ)',
        menuSectionHeader: 'Thêm món mới vào đơn hàng',
        loadingMenu: 'Đang tải thực đơn...',
        addBtn: 'Thêm',
        optionsModalTitle: 'Tùy chọn',
        optionsModalConfirm: 'Thêm vào đơn',
        optionsModalCancel: 'Hủy'
    },
    en: {
        errorTitle: 'COULD NOT EDIT ORDER',
        errorMissingId: 'No order ID found in the link.',
        errorNotFound: (orderId) => `Order #${orderId.toUpperCase()} does not exist or has been deleted.`,
        errorSystem: 'System error loading order details.',
        subtotal: 'Subtotal',
        deliveryFee: 'Delivery fee',
        discount: (percent) => `Discount (${percent}%)`,
        total: 'Total',
        title: (idShort) => `EDIT ORDER #${idShort}`,
        description: 'Remove unavailable items, change quantities, or add new items from the menu below. Resubmit when ready for the restaurant to confirm.',
        emptyOrderWarning: 'Your order must contain at least 1 item. If you do not want any items, let the restaurant cancel it.',
        btnResubmit: 'Resubmit order to restaurant',
        btnResubmitting: 'Resubmitting...',
        errorNotEditable: 'This order is no longer in editable status (the restaurant might have processed it). Please refresh.',
        errorFailedResubmit: 'Could not resubmit the order. Please try again or contact the restaurant.',
        errorItemOos: '⚠️ An item in your order is out of stock. Please check again.',
        badgeOos: 'Sold out',
        oosSectionHeader: 'Out of stock items (automatically removed)',
        menuSectionHeader: 'Add items to your order',
        loadingMenu: 'Loading menu...',
        addBtn: 'Add',
        optionsModalTitle: 'Customize',
        optionsModalConfirm: 'Add to Order',
        optionsModalCancel: 'Cancel'
    },
    fi: {
        errorTitle: 'TILAUKSEN MUOKKAUS EPÄONNISTUI',
        errorMissingId: 'Tilaustunnusta ei löytynyt linkistä.',
        errorNotFound: (orderId) => `Tilausta #${orderId.toUpperCase()} ei ole olemassa tai se on poistettu.`,
        errorSystem: 'Järjestelmävirhe tilaustietoja ladattaessa.',
        subtotal: 'Välisumma',
        deliveryFee: 'Toimitusmaksu',
        discount: (percent) => `Alennus (${percent}%)`,
        total: 'Yhteensä',
        title: (idShort) => `MUOKKAA TILAUSTA #${idShort}`,
        description: 'Poista loppuneet annokset, muuta määriä tai lisää uusia annoksia alla olevasta ruokalistasta. Lähetä tilaus uudelleen ravintolan vahvistettavaksi.',
        emptyOrderWarning: 'Tilauksessa on oltava vähintään 1 annos. Jos et halua mitään annoksia, anna ravintolan peruuttaa tilaus.',
        btnResubmit: 'Lähetä tilaus uudelleen ravintolalle',
        btnResubmitting: 'Lähetetään uudelleen...',
        errorNotEditable: 'Tämä tilaus ei ole enää muokattavissa (ravintola on saattanut jo käsitellä sen). Päivitä sivu.',
        errorFailedResubmit: 'Tilauksen lähetys uudelleen epäonnistui. Yritä uudelleen tai ota yhteyttä ravintolaan.',
        errorItemOos: '⚠️ Jokin tilauksesi annos on loppu. Tarkista tilaus.',
        badgeOos: 'Loppu',
        oosSectionHeader: 'Loppuneet tuotteet (poistettu automaattisesti)',
        menuSectionHeader: 'Lisää annoksia tilaukseesi',
        loadingMenu: 'Ladataan ruokalistaa...',
        addBtn: 'Lisää',
        optionsModalTitle: 'Vaihtoehdot',
        optionsModalConfirm: 'Lisää tilaukseen',
        optionsModalCancel: 'Peruuta'
    },
    sv: {
        errorTitle: 'KUNDE INTE ÄNDRA BESTÄLLNING',
        errorMissingId: 'Inget beställnings-ID hittades i länken.',
        errorNotFound: (orderId) => `Beställning #${orderId.toUpperCase()} existerar inte eller har raderats.`,
        errorSystem: 'Systemfel vid laddning av beställningsinformation.',
        subtotal: 'Delsumma',
        deliveryFee: 'Leveransavgift',
        discount: (percent) => `Rabbat (${percent}%)`,
        total: 'Totalt',
        title: (idShort) => `ÄNDRA BESTÄLLNING #${idShort}`,
        description: 'Ta bort slutsålda produkter, ändra antal eller lägg till nya rätter från menyn nedan. Skicka sedan beställningen igen för bekräftelse.',
        emptyOrderWarning: 'Din beställning måste innehålla minst 1 produkt. Om du inte vill ha några varor, låt restaurangen avbryta den.',
        btnResubmit: 'Skicka beställningen till restaurangen igen',
        btnResubmitting: 'Skickar igen...',
        errorNotEditable: 'Denna beställning är inte längre redigerbar (restaurangen kan ha behandlat den). Uppdatera sidan.',
        errorFailedResubmit: 'Det gick inte att skicka beställningen igen. Försök igen eller kontakta restaurangen.',
        errorItemOos: '⚠️ En vara i din beställning är slutsåld. Vänligen kontrollera igen.',
        badgeOos: 'Slut',
        oosSectionHeader: 'Slutsålda produkter (automatiskt borttagna)',
        menuSectionHeader: 'Lägg till rätter i din beställning',
        loadingMenu: 'Laddar meny...',
        addBtn: 'Lägg till',
        optionsModalTitle: 'Anpassa',
        optionsModalConfirm: 'Lägg till',
        optionsModalCancel: 'Avbryt'
    }
};

const categoryTranslations = {
    "khai vị": { vi: "Khai vị", en: "Appetizers", fi: "Alkupalat", sv: "Förrätter" },
    "mains": { vi: "Món chính", en: "Main Courses", fi: "Pääruoat", sv: "Huvudrätter" },
    "món chính": { vi: "Món chính", en: "Main Courses", fi: "Pääruoat", sv: "Huvudrätter" },
    "đồ uống": { vi: "Đồ uống", en: "Beverages", fi: "Juomat", sv: "Drycker" },
    "tráng miệng": { vi: "Tráng miệng", en: "Desserts", fi: "Jälkiruoat", sv: "Desserter" },
    "phở": { vi: "Phở", en: "Pho", fi: "Pho", sv: "Pho" },
    "bún": { vi: "Bún", en: "Rice Noodle", fi: "Riisinuudeli", sv: "Risnudlar" },
    "cơm": { vi: "Cơm", en: "Rice Dishes", fi: "Riisit", sv: "Risrätter" },
    "món xào": { vi: "Món xào", en: "Stir-fried", fi: "Wokit", sv: "Wok" }
};

function getCategoryTitle(catName, lang) {
    const key = catName.toLowerCase().trim();
    if (categoryTranslations[key]) {
        return categoryTranslations[key][lang] || categoryTranslations[key].en;
    }
    return catName.charAt(0).toUpperCase() + catName.slice(1);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

let orderId = null;
let order = null;
let editItems = [];
let menuCategories = {};

function show(html) {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) {
        contentEl.classList.remove('hidden');
        contentEl.innerHTML = html;
    }
}

function showError(message, lang = 'en') {
    const errorTitle = I18N[lang] ? I18N[lang].errorTitle : I18N.en.errorTitle;
    const backToMenuTexts = {
        vi: 'Quay lại thực đơn',
        en: 'Back to Menu',
        fi: 'Takaisin ruokalistaan',
        sv: 'Tillbaka till menyn'
    };
    const backText = backToMenuTexts[lang] || backToMenuTexts.en;
    show(`
        <div class="text-center py-8 space-y-4">
            <div class="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400">
                <span class="material-symbols-outlined text-4xl">error</span>
            </div>
            <h3 class="text-xl font-bold text-white">${errorTitle}</h3>
            <p class="text-secondary text-sm">${message}</p>
            <a href="/" class="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">${backText}</a>
        </div>
    `);
}

function totals() {
    const subtotal = editItems.reduce((s, i) => s + (Number(i.price) || 0) * i.qty, 0);
    const discountPercent = Number(order.discountPercent) || 0;
    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    const deliveryFee = Number(order.deliveryFee) || 0;
    const total = subtotal + deliveryFee - discountAmount;
    return { subtotal, discountPercent, discountAmount, deliveryFee, total };
}

function normalizeOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.map(opt => {
        if (typeof opt === 'string') {
            return {
                name: opt,
                nameVi: opt,
                nameEn: opt,
                nameFi: opt,
                nameSv: opt,
                type: "toggle",
                choices: [{ label: opt, labelVi: opt, labelEn: opt, labelFi: opt, labelSv: opt, price: 0 }]
            };
        }
        
        const name = opt.name || '';
        const nameVi = opt.nameVi || name;
        const nameEn = opt.nameEn || name;
        const nameFi = opt.nameFi || name;
        const nameSv = opt.nameSv || name;
        
        const choices = Array.isArray(opt.choices) ? opt.choices.map(c => {
            const label = c.label || '';
            return {
                label: label,
                labelVi: c.labelVi || label,
                labelEn: c.labelEn || label,
                labelFi: c.labelFi || label,
                labelSv: c.labelSv || label,
                price: parseFloat(c.price) || 0
            };
        }) : [];

        return {
            name,
            nameVi,
            nameEn,
            nameFi,
            nameSv,
            type: opt.type || 'toggle',
            choices
        };
    });
}

function addToEditItems(id, name, price, image, selectedOptions, names, rawId, isNew = true) {
    const optKey = selectedOptions && selectedOptions.length > 0 ? selectedOptions.sort().join('|') : '';
    const uniqueId = optKey ? `${id}__${optKey}` : id;

    const existing = editItems.find(i => i.id === uniqueId);
    if (existing) {
        existing.qty += 1;
    } else {
        editItems.push({
            id: uniqueId,
            rawId: rawId || id,
            name: name,
            names: names || null,
            price: Number(price) || 0,
            image: image || '',
            qty: 1,
            options: selectedOptions || [],
            isNew: isNew
        });
    }
    render();
}

function showOptionsPopup(item, lang, basePrice) {
    if (document.getElementById('options-modal-wrapper')) return;

    const nameKey = lang === 'vi' ? 'nameVi' : (lang === 'fi' ? 'nameFi' : (lang === 'sv' ? 'nameSv' : 'nameEn'));
    const displayName = item[nameKey] || item.nameVi || item.nameEn || item.nameSv || 'Unknown';
    const normalizedOptions = normalizeOptions(item.options);

    const optionsHTML = normalizedOptions.map((group, groupIdx) => {
        const title = lang === 'vi' ? group.nameVi : (lang === 'fi' ? group.nameFi : (lang === 'sv' ? group.nameSv : group.nameEn));
        const choicesHtml = group.choices.map((choice, choiceIdx) => {
            const label = lang === 'vi' ? choice.labelVi : (lang === 'fi' ? choice.labelFi : (lang === 'sv' ? choice.labelSv : choice.labelEn));
            const priceText = choice.price > 0 ? ` (+&euro;${choice.price.toFixed(2)})` : '';
            const id = `opt-${groupIdx}-${choiceIdx}`;
            
            if (group.type === 'single-select') {
                return `
                    <label class="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                        <input type="radio" name="opt-group-${groupIdx}" id="${id}" value="${label}" data-price="${choice.price}" data-group="${title}" class="opt-radio w-5 h-5 rounded-full text-primary bg-surface border-gray-600 focus:ring-primary focus:ring-offset-0" ${choiceIdx === 0 ? 'checked' : ''}>
                        <span class="text-white text-sm font-medium">${label}${priceText}</span>
                    </label>
                `;
            } else {
                return `
                    <label class="flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all">
                        <input type="checkbox" id="${id}" value="${label}" data-price="${choice.price}" data-group="${title}" class="opt-checkbox w-5 h-5 rounded text-primary bg-surface border-gray-600 focus:ring-primary focus:ring-offset-0">
                        <span class="text-white text-sm font-medium">${label}${priceText}</span>
                    </label>
                `;
            }
        }).join('');

        return `
            <div class="mb-4">
                <h5 class="text-xs text-secondary font-bold uppercase tracking-wider mb-2">${title}</h5>
                <div class="space-y-2">${choicesHtml}</div>
            </div>
        `;
    }).join('');

    const addBtnText = I18N[lang].optionsModalConfirm;
    const cancelText = I18N[lang].optionsModalCancel;
    const titleText = I18N[lang].optionsModalTitle;

    const fallbackImg = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500';
    const imgSrc = item.image || fallbackImg;

    const modalWrapper = document.createElement('div');
    modalWrapper.id = 'options-modal-wrapper';
    modalWrapper.style.cssText = `
        position: fixed; inset: 0; width: 100vw; height: 100dvh; z-index: 2147483647;
        display: flex; align-items: center; justify-content: center; overflow-y: auto;
        padding: 16px; background: rgba(0, 0, 0, 0.7); font-family: Inter, sans-serif;
        color: #f3f4f6; box-sizing: border-box; backdrop-filter: blur(4px);
    `;
    modalWrapper.setAttribute('role', 'dialog');
    modalWrapper.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.id = 'options-card';
    card.className = 'flex max-h-[calc(100dvh-2rem)] w-full max-w-[28rem] scale-95 flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl transition-all duration-300 sm:max-h-[75vh]';
    card.style.backgroundColor = '#121824';

    card.innerHTML = `
        <div class="relative h-28 shrink-0 overflow-hidden">
            <img src="${imgSrc}" class="w-full h-full object-cover" onerror="this.onerror=null;this.src='${fallbackImg}'">
            <div class="absolute inset-0 bg-gradient-to-t from-[#121824] to-transparent"></div>
            <h3 class="absolute bottom-4 left-5 text-2xl font-bold font-['EB_Garamond'] text-white drop-shadow-lg">${displayName}</h3>
            <span id="popup-price-tag" class="absolute top-3 right-3 text-lg font-bold text-primary bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">&euro;${basePrice.toFixed(2)}</span>
        </div>
        <div class="px-5 pt-4 pb-2 shrink-0">
            <h4 class="text-primary font-semibold flex items-center gap-2 text-yellow-500">
                <span class="material-symbols-outlined text-sm">tune</span> ${titleText}
            </h4>
        </div>
        <div class="px-5 overflow-y-auto flex-1 min-h-0 space-y-4">${optionsHTML}</div>
        <div class="p-5 shrink-0 flex gap-3">
            <button id="popup-cancel" class="flex-1 py-3 border border-white/20 text-secondary rounded-xl hover:bg-white/5 transition-colors font-medium">
                ${cancelText}
            </button>
            <button id="popup-confirm" class="flex-1 py-3 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 border border-gray-200">
                <span class="material-symbols-outlined text-sm">add_shopping_cart</span> ${addBtnText}
            </button>
        </div>
    `;

    modalWrapper.appendChild(card);
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.appendChild(modalWrapper);

    requestAnimationFrame(() => {
        modalWrapper.style.opacity = '1';
        card.classList.remove('scale-95');
        card.classList.add('scale-100');
    });

    function updatePopupPrice() {
        let extra = 0;
        card.querySelectorAll('.opt-checkbox:checked').forEach(cb => {
            extra += parseFloat(cb.getAttribute('data-price')) || 0;
        });
        card.querySelectorAll('.opt-radio:checked').forEach(r => {
            extra += parseFloat(r.getAttribute('data-price')) || 0;
        });
        const total = basePrice + extra;
        const priceTag = card.querySelector('#popup-price-tag');
        if (priceTag) priceTag.innerHTML = `&euro;${total.toFixed(2)}`;
    }

    card.querySelectorAll('.opt-checkbox, .opt-radio').forEach(input => {
        input.addEventListener('change', updatePopupPrice);
    });

    const closePopup = () => {
        modalWrapper.remove();
        document.documentElement.style.overflow = previousHtmlOverflow;
        document.body.style.overflow = previousBodyOverflow;
    };

    card.querySelector('#popup-cancel').addEventListener('click', closePopup);
    modalWrapper.addEventListener('click', (e) => {
        if (e.target === modalWrapper) closePopup();
    });

    card.querySelector('#popup-confirm').addEventListener('click', () => {
        const selectedStrings = [];
        let finalPrice = basePrice;

        card.querySelectorAll('.opt-checkbox:checked').forEach(cb => {
            const lbl = cb.value;
            const pr = parseFloat(cb.getAttribute('data-price')) || 0;
            finalPrice += pr;
            const displayStr = pr > 0 ? `${lbl} (+\u20AC${pr.toFixed(2)})` : lbl;
            selectedStrings.push(displayStr);
        });

        card.querySelectorAll('.opt-radio:checked').forEach(r => {
            const grp = r.getAttribute('data-group');
            const lbl = r.value;
            const pr = parseFloat(r.getAttribute('data-price')) || 0;
            finalPrice += pr;
            const displayStr = pr > 0 ? `${grp}: ${lbl} (+\u20AC${pr.toFixed(2)})` : `${grp}: ${lbl}`;
            selectedStrings.push(displayStr);
        });

        addToEditItems(item.id, displayName, finalPrice, item.image || '', selectedStrings, { vi: item.nameVi, en: item.nameEn, fi: item.nameFi, sv: item.nameSv }, item.id, true);
        closePopup();
    });
}

function render() {
    const orderLang = order.language || localStorage.getItem('selectedLanguage') || 'en';
    const lang = I18N[orderLang] ? orderLang : 'en';

    const idShort = orderId.substring(0, 8).toUpperCase();
    const t = totals();

    const rows = editItems.map((i, idx) => {
        const displayName = (i.names && i.names[lang]) ? i.names[lang] : i.name;
        return `
            <div class="flex items-center gap-3 py-3">
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-white text-sm truncate">${escapeHtml(displayName)}</p>
                    ${Array.isArray(i.options) && i.options.length > 0 ? `<p class="text-xs text-teal-400 truncate">${escapeHtml(i.options.join(', '))}</p>` : ''}
                    <p class="text-primary text-sm font-semibold">€${(Number(i.price) || 0).toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-2 bg-black/30 rounded-lg p-1 border border-white/10">
                    <button type="button" data-action="dec" data-idx="${idx}" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">remove</span></button>
                    <span class="w-5 text-center font-bold text-white">${i.qty}</span>
                    <button type="button" data-action="inc" data-idx="${idx}" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">add</span></button>
                </div>
                <button type="button" data-action="remove" data-idx="${idx}" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors" title="Bỏ món này">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
    }).join('');

    let oosSectionHtml = '';
    if (order.outOfStockItems && order.outOfStockItems.length > 0) {
        const oosRows = order.outOfStockItems.map(i => {
            const displayName = (i.names && i.names[lang]) ? i.names[lang] : i.name;
            return `
                <div class="flex items-center justify-between py-2.5 opacity-50 line-through decoration-red-500 decoration-2">
                    <span class="text-white/80 text-sm font-medium">${escapeHtml(displayName)}</span>
                    <span class="text-[10px] bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full border border-red-600/30 font-semibold shrink-0 ml-3">${I18N[lang].badgeOos}</span>
                </div>
            `;
        }).join('');
        oosSectionHtml = `
            <div class="space-y-2 pt-4 border-t border-white/5">
                <h4 class="text-xs font-bold text-red-400 uppercase tracking-wider">${I18N[lang].oosSectionHeader}</h4>
                <div class="bg-red-500/5 rounded-xl px-4 divide-y divide-white/5 border border-red-500/15">${oosRows}</div>
            </div>`;
    }

    // Build categories and item selection menu
    let menuHtml = `
        <div class="border-t border-white/10 pt-8 mt-8 space-y-6">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">restaurant_menu</span>
                <span>${I18N[lang].menuSectionHeader}</span>
            </h3>
            <div class="space-y-8">
    `;

    const sortedCatKeys = Object.keys(menuCategories).sort((a, b) => {
        const priority = ['khai vị', 'phở', 'bún', 'cơm', 'món xào', 'tráng miệng', 'đồ uống'];
        const idxA = priority.indexOf(a.toLowerCase());
        const idxB = priority.indexOf(b.toLowerCase());
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
    });

    for (const catKey of sortedCatKeys) {
        const catData = menuCategories[catKey];
        const validItems = catData.items.filter(item => item.hidden !== true);
        if (validItems.length === 0) continue;

        const catTitle = catData.title[lang] || catData.title.en || catData.title.vi;
        menuHtml += `
            <div class="space-y-3">
                <h4 class="text-xs font-bold text-primary uppercase tracking-wider border-b border-white/5 pb-1">${escapeHtml(catTitle)}</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        `;

        validItems.forEach(item => {
            const nameKey = lang === 'vi' ? 'nameVi' : (lang === 'fi' ? 'nameFi' : (lang === 'sv' ? 'nameSv' : 'nameEn'));
            const displayName = item[nameKey] || item.nameVi || item.nameEn || item.nameSv || 'Unknown';
            
            // Check OOS
            const isOos = (order.outOfStockItems || []).some(oosItem => oosItem.id === item.id);
            const disabledClass = isOos ? 'opacity-50 pointer-events-none' : '';
            const badge = isOos ? `<span class="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.5 rounded border border-red-600/30 ml-2 uppercase font-semibold shrink-0">${I18N[lang].badgeOos}</span>` : '';

            // Handle lounas pricing
            const isLounas = /lounas|lunch/i.test(item.categoryVi || '') || 
                             /lounas|lunch/i.test(item.categoryEn || '') || 
                             /lounas|lunch/i.test(item.categoryFi || '') ||
                             /lounas|lunch/i.test(item.categorySv || '');
            let isLounasTime = false;
            try {
                const helsinkiTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Helsinki" });
                const dateH = new Date(helsinkiTime);
                const day = dateH.getDay();
                const hours = dateH.getHours();
                const minutes = dateH.getMinutes();
                const totalMinutes = hours * 60 + minutes;
                if (day >= 1 && day <= 5 && totalMinutes >= 660 && totalMinutes <= 870) {
                    isLounasTime = true;
                }
            } catch(e) {}

            const price = (isLounas && isLounasTime) ? 13.7 : (Number(item.price) || 0);

            const hasOptions = Array.isArray(item.options) && item.options.length > 0;
            const optionsBadge = hasOptions ? `<span class="text-[10px] bg-teal-600/10 text-teal-400 px-1.5 py-0.5 rounded border border-teal-600/20 font-medium ml-2">options</span>` : '';

            menuHtml += `
                <div class="flex items-center gap-3 bg-black/10 border border-white/5 hover:border-primary/30 rounded-xl p-3 transition-all ${disabledClass}">
                    <img src="${item.image || ''}" class="w-12 h-12 rounded-lg object-cover bg-gray-800 shrink-0" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=120'">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center">
                            <span class="font-semibold text-white text-sm truncate">${escapeHtml(displayName)}</span>
                            ${badge}
                            ${optionsBadge}
                        </div>
                        <span class="text-primary text-xs font-bold">€${price.toFixed(2)}</span>
                    </div>
                    <button type="button" data-menu-item-id="${item.id}" class="btn-add-new-item w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 text-black rounded-lg transition-colors shrink-0 disabled:opacity-50" ${isOos ? 'disabled' : ''}>
                        <span class="material-symbols-outlined text-sm font-bold">add</span>
                    </button>
                </div>
            `;
        });

        menuHtml += `
                </div>
            </div>
        `;
    }

    menuHtml += `
            </div>
        </div>
    `;

    show(`
        <div class="space-y-6">
            <div class="text-center space-y-2">
                <div class="mx-auto w-16 h-16 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-400">
                    <span class="material-symbols-outlined text-4xl">edit_note</span>
                </div>
                <h3 class="text-xl font-bold text-white">${I18N[lang].title(idShort)}</h3>
                <p class="text-secondary text-sm max-w-md mx-auto">${I18N[lang].description}</p>
            </div>

            ${editItems.length === 0 ? `
                <p class="text-center text-red-400 text-sm py-6">${I18N[lang].emptyOrderWarning}</p>
            ` : `
                <div class="bg-black/20 rounded-xl px-4 divide-y divide-white/5 border border-white/5">${rows}</div>
            `}

            ${oosSectionHtml}

            <div class="bg-black/20 rounded-xl p-4 border border-white/5 space-y-1.5 text-sm">
                <div class="flex justify-between text-secondary"><span>${I18N[lang].subtotal}</span><span>€${t.subtotal.toFixed(2)}</span></div>
                ${t.deliveryFee > 0 ? `<div class="flex justify-between text-secondary"><span>${I18N[lang].deliveryFee}</span><span>€${t.deliveryFee.toFixed(2)}</span></div>` : ''}
                ${t.discountAmount > 0 ? `<div class="flex justify-between text-green-400"><span>${I18N[lang].discount(t.discountPercent)}</span><span>-€${t.discountAmount.toFixed(2)}</span></div>` : ''}
                <div class="flex justify-between text-white font-bold text-base pt-2 border-t border-white/10"><span>${I18N[lang].total}</span><span class="text-primary">€${t.total.toFixed(2)}</span></div>
            </div>

            <div id="edit-error" class="hidden text-center text-red-400 text-sm"></div>

            <button type="button" id="btn-resubmit" ${editItems.length === 0 ? 'disabled' : ''} class="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span class="material-symbols-outlined">send</span>
                <span>${I18N[lang].btnResubmit}</span>
            </button>

            ${menuHtml}
        </div>
    `);

    contentEl.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = Number(btn.dataset.idx);
            const action = btn.dataset.action;
            if (action === 'inc' && editItems[idx].qty < 99) editItems[idx].qty += 1;
            if (action === 'dec') {
                editItems[idx].qty -= 1;
                if (editItems[idx].qty <= 0) editItems.splice(idx, 1);
            }
            if (action === 'remove') editItems.splice(idx, 1);
            render();
        });
    });

    contentEl.querySelectorAll('.btn-add-new-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.menuItemId;
            let foundItem = null;
            for (const catKey of Object.keys(menuCategories)) {
                foundItem = menuCategories[catKey].items.find(i => i.id === itemId);
                if (foundItem) break;
            }
            if (!foundItem) return;

            // Handle lounas pricing
            const isLounas = /lounas|lunch/i.test(foundItem.categoryVi || '') || 
                             /lounas|lunch/i.test(foundItem.categoryEn || '') || 
                             /lounas|lunch/i.test(foundItem.categoryFi || '') ||
                             /lounas|lunch/i.test(foundItem.categorySv || '');
            let isLounasTime = false;
            try {
                const helsinkiTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Helsinki" });
                const dateH = new Date(helsinkiTime);
                const day = dateH.getDay();
                const hours = dateH.getHours();
                const minutes = dateH.getMinutes();
                const totalMinutes = hours * 60 + minutes;
                if (day >= 1 && day <= 5 && totalMinutes >= 660 && totalMinutes <= 870) {
                    isLounasTime = true;
                }
            } catch(e) {}

            const price = (isLounas && isLounasTime) ? 13.7 : (Number(foundItem.price) || 0);

            if (Array.isArray(foundItem.options) && foundItem.options.length > 0) {
                showOptionsPopup(foundItem, lang, price);
            } else {
                const nameKey = lang === 'vi' ? 'nameVi' : (lang === 'fi' ? 'nameFi' : (lang === 'sv' ? 'nameSv' : 'nameEn'));
                const safeName = foundItem[nameKey] || foundItem.nameEn || foundItem.nameVi || 'Unknown';
                addToEditItems(foundItem.id, safeName, price, foundItem.image || '', [], { vi: foundItem.nameVi, en: foundItem.nameEn, fi: foundItem.nameFi, sv: foundItem.nameSv }, foundItem.id, true);
            }
        });
    });

    const btnResubmit = document.getElementById('btn-resubmit');
    if (btnResubmit) btnResubmit.addEventListener('click', resubmit);
}

async function resubmit() {
    const orderLang = order.language || localStorage.getItem('selectedLanguage') || 'en';
    const lang = I18N[orderLang] ? orderLang : 'en';

    const btn = document.getElementById('btn-resubmit');
    const errEl = document.getElementById('edit-error');
    btn.disabled = true;
    btn.innerHTML = `<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><span>${I18N[lang].btnResubmitting}</span>`;

    try {
        const resp = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'resubmitOrder',
                args: {
                    orderId,
                    items: editItems.map(i => ({
                        id: i.id,
                        qty: i.qty,
                        isNew: !!i.isNew,
                        rawId: i.rawId || null,
                        options: i.options || []
                    })),
                },
            }),
        });
        const data = await resp.json();
        if (!resp.ok || !data.success) {
            throw new Error(data.error || 'Gửi lại thất bại');
        }

        window.location.href = `order-pending?orderId=${encodeURIComponent(orderId)}`;
    } catch (e) {
        console.error('Resubmit failed:', e);
        if (errEl) {
            errEl.classList.remove('hidden');
            let errMsg = I18N[lang].errorFailedResubmit;
            if (e.message === 'ORDER_NOT_EDITABLE') {
                errMsg = I18N[lang].errorNotEditable;
            } else if (e.message === 'ITEM_OUT_OF_STOCK') {
                errMsg = I18N[lang].errorItemOos;
            }
            errEl.textContent = '⚠️ ' + errMsg;
        }
        btn.disabled = false;
        btn.innerHTML = `<span class="material-symbols-outlined">send</span><span>${I18N[lang].btnResubmit}</span>`;
    }
}

async function loadMenu() {
    let useCache = false;
    try {
        const cachedStr = localStorage.getItem('phoMenuCache');
        const cacheTime = localStorage.getItem('phoMenuCacheTime');
        if (cachedStr && cacheTime && (Date.now() - parseInt(cacheTime) < 3600000)) {
            const parsed = JSON.parse(cachedStr);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
                menuCategories = parsed;
                useCache = true;
            }
        }
    } catch (e) {}

    if (!useCache) {
        try {
            const querySnapshot = await getDocs(collection(db, "menu"));
            menuCategories = {};
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                data.id = docSnap.id;
                if (data.hidden === true) return;
                
                const catVi = data.categoryVi || data.category || 'Món chính';
                const catEn = data.categoryEn || getCategoryTitle(catVi, 'en');
                const catFi = data.categoryFi || getCategoryTitle(catVi, 'fi');
                const catSv = data.categorySv || getCategoryTitle(catVi, 'sv');
                
                const groupingKey = catVi.toLowerCase().trim();
                if (!menuCategories[groupingKey]) {
                    menuCategories[groupingKey] = {
                        title: { vi: catVi, en: catEn, fi: catFi, sv: catSv },
                        items: []
                    };
                }
                menuCategories[groupingKey].items.push(data);
            });
            try {
                localStorage.setItem('phoMenuCache', JSON.stringify(menuCategories));
                localStorage.setItem('phoMenuCacheTime', Date.now().toString());
            } catch (e) {}
        } catch (err) {
            console.error("Failed to load menu:", err);
        }
    }
}

async function init() {
    orderId = new URLSearchParams(window.location.search).get('orderId');
    const urlLang = localStorage.getItem('selectedLanguage') || 'en';
    const initialLang = I18N[urlLang] ? urlLang : 'en';

    if (!orderId) {
        showError(I18N[initialLang].errorMissingId, initialLang);
        return;
    }

    try {
        await loadMenu();

        const snap = await getDoc(doc(db, "orders", orderId));
        if (!snap.exists()) {
            showError(I18N[initialLang].errorNotFound(orderId), initialLang);
            return;
        }
        order = snap.data();

        if (order.confirmation !== 'out_of_stock') {
            window.location.href = order.confirmation === 'awaiting'
                ? `order-pending?orderId=${encodeURIComponent(orderId)}`
                : `order-tracking?orderId=${encodeURIComponent(orderId)}`;
            return;
        }

        const oosList = order.outOfStockItems || [];
        const oosIds = new Set(oosList.map(i => String(i.id)));

        // Remove OOS items from the active list automatically
        editItems = (order.items || [])
            .filter(i => !oosIds.has(String(i.id)) && !(i.rawId && oosIds.has(String(i.rawId))))
            .map(i => ({
                id: i.id,
                rawId: i.rawId || i.id.split('__')[0],
                name: i.name,
                names: i.names || null,
                price: Number(i.price) || 0,
                qty: Number.parseInt(i.qty, 10) || 1,
                options: Array.isArray(i.options) ? i.options : [],
                isNew: false
            }));
        render();
    } catch (e) {
        console.error("Error loading order:", e);
        showError(I18N[initialLang].errorSystem, initialLang);
    }
}

window.addEventListener('languageChanged', () => {
    if (order && orderId) {
        render();
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
