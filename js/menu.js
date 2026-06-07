import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const menuContainer = document.getElementById('menu-container');

// --- NORMALIZATION UTILITY FOR BACKWARD COMPATIBILITY ---
function normalizeOptions(options) {
    if (!options || !Array.isArray(options)) return [];
    return options.map(opt => {
        if (typeof opt === 'string') {
            return {
                name: opt,
                nameVi: opt,
                nameEn: opt,
                nameFi: opt,
                type: "toggle",
                choices: [{ label: opt, labelVi: opt, labelEn: opt, labelFi: opt, price: 0 }]
            };
        }
        
        const name = opt.name || '';
        const nameVi = opt.nameVi || name;
        const nameEn = opt.nameEn || name;
        const nameFi = opt.nameFi || name;
        
        const choices = Array.isArray(opt.choices) ? opt.choices.map(c => {
            const label = c.label || '';
            return {
                label: label,
                labelVi: c.labelVi || label,
                labelEn: c.labelEn || label,
                labelFi: c.labelFi || label,
                price: parseFloat(c.price) || 0
            };
        }) : [];

        return {
            name,
            nameVi,
            nameEn,
            nameFi,
            type: opt.type || 'toggle',
            choices
        };
    });
}

// --- DYNAMIC CATEGORY TRANSLATIONS MAP ---
const categoryTranslations = {
    "khai vị": { vi: "Khai vị", en: "Appetizers", fi: "Alkupalat" },
    "mains": { vi: "Món chính", en: "Main Courses", fi: "Pääruoat" },
    "món chính": { vi: "Món chính", en: "Main Courses", fi: "Pääruoat" },
    "đồ uống": { vi: "Đồ uống", en: "Beverages", fi: "Juomat" },
    "tráng miệng": { vi: "Tráng miệng", en: "Desserts", fi: "Jälkiruoat" },
    "phở": { vi: "Phở", en: "Pho", fi: "Pho" },
    "bún": { vi: "Bún", en: "Rice Noodle", fi: "Riisinuudeli" },
    "cơm": { vi: "Cơm", en: "Rice Dishes", fi: "Riisit" },
    "món xào": { vi: "Món xào", en: "Stir-fried", fi: "Wokit" }
};

function getCategoryTitle(catName, lang) {
    const key = catName.toLowerCase().trim();
    if (categoryTranslations[key]) {
        return categoryTranslations[key][lang] || categoryTranslations[key].en;
    }
    return catName.charAt(0).toUpperCase() + catName.slice(1);
}

// --- Options Popup Modal ---
function showOptionsPopup(item, lang) {
    const nameKey = lang === 'vi' ? 'nameVi' : (lang === 'fi' ? 'nameFi' : 'nameEn');
    const displayName = item[nameKey] || item.nameVi || item.nameEn || 'Unknown';

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'options-overlay';
    overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease-out';

    const normalizedOptions = normalizeOptions(item.options);

    const optionsHTML = normalizedOptions.map((group, groupIdx) => {
        const title = lang === 'vi' ? group.nameVi : (lang === 'fi' ? group.nameFi : group.nameEn);
        const choicesHtml = group.choices.map((choice, choiceIdx) => {
            const label = lang === 'vi' ? choice.labelVi : (lang === 'fi' ? choice.labelFi : choice.labelEn);
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
                <div class="space-y-2">
                    ${choicesHtml}
                </div>
            </div>
        `;
    }).join('');

    const addBtnText = lang === 'vi' ? 'Thêm vào giỏ hàng' : (lang === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart');
    const cancelText = lang === 'vi' ? 'Hủy' : (lang === 'fi' ? 'Peruuta' : 'Cancel');
    const titleText = lang === 'vi' ? 'Tùy chọn' : (lang === 'fi' ? 'Vaihtoehdot' : 'Customize');

    overlay.innerHTML = `
        <div class="bg-surface border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" style="animation: slideUp 0.3s ease-out">
            <div class="relative h-40 overflow-hidden">
                <img src="${item.image || ''}" class="w-full h-full object-cover" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500'">
                <div class="absolute inset-0 bg-gradient-to-t from-surface-dim to-transparent"></div>
                <h3 class="absolute bottom-4 left-5 text-2xl font-bold font-['EB_Garamond'] text-white drop-shadow-lg">${displayName}</h3>
                <span id="popup-price-tag" class="absolute top-3 right-3 text-lg font-bold text-primary bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">&euro;${(item.price || 0).toFixed(2)}</span>
            </div>
            <div class="p-5">
                <h4 class="text-primary font-semibold mb-3 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">tune</span> ${titleText}
                </h4>
                <div class="space-y-4 max-h-60 overflow-y-auto mb-5">
                    ${optionsHTML}
                </div>
                <div class="flex gap-3">
                    <button id="popup-cancel" class="flex-1 py-3 border border-white/20 text-secondary rounded-xl hover:bg-white/5 transition-colors font-medium">
                        ${cancelText}
                    </button>
                    <button id="popup-confirm" class="flex-1 py-3 bg-white hover:bg-gray-100 text-black rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 border border-gray-200">
                        <span class="material-symbols-outlined text-sm">add_shopping_cart</span> ${addBtnText}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Dynamic Price Updates
    const basePrice = item.price || 0;
    function updatePopupPrice() {
        let extra = 0;
        overlay.querySelectorAll('.opt-checkbox:checked').forEach(cb => {
            extra += parseFloat(cb.getAttribute('data-price')) || 0;
        });
        overlay.querySelectorAll('.opt-radio:checked').forEach(r => {
            extra += parseFloat(r.getAttribute('data-price')) || 0;
        });
        const total = basePrice + extra;
        const priceTag = overlay.querySelector('#popup-price-tag');
        if (priceTag) {
            priceTag.innerHTML = `&euro;${total.toFixed(2)}`;
        }
    }

    // Attach dynamic price calculations on input changes
    overlay.querySelectorAll('.opt-checkbox, .opt-radio').forEach(input => {
        input.addEventListener('change', updatePopupPrice);
    });

    // Close on cancel or overlay click
    const closePopup = () => {
        overlay.remove();
        document.body.style.overflow = '';
    };
    overlay.querySelector('#popup-cancel').addEventListener('click', closePopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closePopup(); });

    // Close on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closePopup();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);

    // Confirm click
    overlay.querySelector('#popup-confirm').addEventListener('click', () => {
        const selectedStrings = [];
        let finalPrice = basePrice;

        overlay.querySelectorAll('.opt-checkbox:checked').forEach(cb => {
            const grp = cb.getAttribute('data-group');
            const lbl = cb.value;
            const pr = parseFloat(cb.getAttribute('data-price')) || 0;
            finalPrice += pr;
            
            const displayStr = pr > 0 ? `${lbl} (+&euro;${pr.toFixed(2)})` : lbl;
            selectedStrings.push(displayStr);
        });

        overlay.querySelectorAll('.opt-radio:checked').forEach(r => {
            const grp = r.getAttribute('data-group');
            const lbl = r.value;
            const pr = parseFloat(r.getAttribute('data-price')) || 0;
            finalPrice += pr;
            
            const displayStr = pr > 0 ? `${grp}: ${lbl} (+&euro;${pr.toFixed(2)})` : `${grp}: ${lbl}`;
            selectedStrings.push(displayStr);
        });

        const safeName = (item.nameEn || item.nameVi || 'Unknown');
        
        // Trigger fly to cart animation on the popup modal card
        const popupModal = overlay.querySelector('div');
        if (popupModal) {
            window.flyToCart(popupModal);
        }
        
        window.addToCart(item.id, safeName, finalPrice, item.image || '', selectedStrings);
        document.removeEventListener('keydown', handleEsc);
        overlay.remove();
        document.body.style.overflow = '';
    });
}

// Inject popup animation styles
const popupStyle = document.createElement('style');
popupStyle.textContent = `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
    #options-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 99999 !important;
        background-color: rgba(0, 0, 0, 0.7) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
        margin: 0 !important;
        padding: 16px !important;
        box-sizing: border-box !important;
    }
    #options-overlay > div {
        max-height: 90vh !important;
        display: flex !important;
        flex-direction: column !important;
        position: relative !important;
        width: 100% !important;
        max-width: 28rem !important; /* max-w-md equivalent */
    }
`;
document.head.appendChild(popupStyle);


async function loadMenu() {
    if (!menuContainer) return;
    
    menuContainer.innerHTML = '<div class="col-span-full text-center py-20"><span class="material-symbols-outlined animate-spin text-4xl text-primary">sync</span><p class="mt-4 text-secondary">Loading Menu from Firebase...</p></div>';

    try {
        const querySnapshot = await getDocs(collection(db, "menu"));
        
        if (querySnapshot.empty) {
            menuContainer.innerHTML = '<div class="col-span-full text-center py-20 text-secondary">Our menu is currently being updated. Please check back later.</div>';
            return;
        }

        // Group dynamically by category field
        const categories = {};

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            data.id = docSnap.id;
            
            const catVi = data.categoryVi || data.category || 'Món chính';
            const catEn = data.categoryEn || getCategoryTitle(catVi, 'en');
            const catFi = data.categoryFi || getCategoryTitle(catVi, 'fi');
            
            const groupingKey = catVi.toLowerCase().trim();
            if (!categories[groupingKey]) {
                categories[groupingKey] = {
                    title: {
                        vi: catVi,
                        en: catEn,
                        fi: catFi
                    },
                    items: []
                };
            }
            categories[groupingKey].items.push(data);
        });

        menuContainer.innerHTML = '';
        const lang = localStorage.getItem('selectedLanguage') || 'en';

        // Store items globally for popup access
        window.__menuItems = {};

        // Sort categories to put common ones first (optional but nice)
        const sortedCatKeys = Object.keys(categories).sort((a, b) => {
            const priority = ['khai vị', 'phở', 'bún', 'cơm', 'món xào', 'tráng miệng', 'đồ uống'];
            const idxA = priority.indexOf(a.toLowerCase());
            const idxB = priority.indexOf(b.toLowerCase());
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        for (const catKey of sortedCatKeys) {
            const catData = categories[catKey];
            if (catData.items.length === 0) continue;

            const header = document.createElement('div');
            header.className = 'col-span-full mt-12 mb-6';
            header.innerHTML = `<h2 class="text-3xl font-bold font-['EB_Garamond'] text-primary border-b border-gray-800 pb-2 dynamic-cat-title" 
                data-vi="${catData.title.vi}" data-en="${catData.title.en}" data-fi="${catData.title.fi}">
                ${catData.title[lang] || catData.title.en}</h2>`;
            menuContainer.appendChild(header);

            catData.items.forEach(item => {
                window.__menuItems[item.id] = item;

                // --- LOUNAS LOGIC ---
                const isLounas = /lounas|lunch/i.test(item.categoryVi || '') || 
                                 /lounas|lunch/i.test(item.categoryEn || '') || 
                                 /lounas|lunch/i.test(item.categoryFi || '');
                let isLounasTime = false;
                try {
                    const helsinkiTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Helsinki" });
                    const dateH = new Date(helsinkiTime);
                    const day = dateH.getDay();
                    const hours = dateH.getHours();
                    const minutes = dateH.getMinutes();
                    const totalMinutes = hours * 60 + minutes;
                    // Mon-Fri (1-5), 11:00 (660) to 14:30 (870)
                    if (day >= 1 && day <= 5 && totalMinutes >= 660 && totalMinutes <= 870) {
                        isLounasTime = true;
                    }
                } catch(e) {
                    console.error("Timezone check failed", e);
                }

                if (isLounas) {
                    item.price = 13.7; // Exclusive Lounas price
                }
                const lounasDimClass = (isLounas && !isLounasTime) ? 'opacity-60 grayscale' : '';
                // ---------------------

                const nameKey = lang === 'vi' ? 'nameVi' : (lang === 'fi' ? 'nameFi' : 'nameEn');
                const descKey = lang === 'vi' ? 'descVi' : (lang === 'fi' ? 'descFi' : 'descEn');
                const displayName = item[nameKey] || item.nameVi || item.nameEn || 'Unknown';
                const displayDesc = item[descKey] || item.descVi || item.descEn || '';
                const addText = lang === 'vi' ? 'Thêm vào giỏ' : (lang === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart');

                const normalized = normalizeOptions(item.options);
                const hasOptions = normalized.length > 0;
                const optionsBadge = hasOptions 
                    ? `<span class="text-xs bg-teal-600/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-600/30">${normalized.length} options</span>` 
                    : '';

                const card = document.createElement('div');
                card.className = `bg-surface rounded-2xl overflow-hidden shadow-xl border border-gray-800/50 hover:border-primary/50 transition-all duration-300 group flex flex-col h-full ${lounasDimClass}`;

                card.innerHTML = `
                    <div class="relative h-56 overflow-hidden">
                        <img src="${item.image || ''}" alt="${displayName}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500'"/>
                        <div class="absolute inset-0 bg-gradient-to-t from-surface-dim to-transparent opacity-80"></div>
                        <div class="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                            <div>
                                <h3 class="text-2xl font-bold font-['EB_Garamond'] text-white drop-shadow-md dynamic-name" 
                                    data-vi="${item.nameVi || ''}" data-en="${item.nameEn || ''}" data-fi="${item.nameFi || ''}">
                                    ${displayName}
                                </h3>
                                ${optionsBadge}
                            </div>
                            <span class="text-xl font-bold text-primary bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">&euro;${(item.price || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <p class="text-secondary text-sm leading-relaxed mb-6 dynamic-desc"
                           data-vi="${item.descVi || ''}" data-en="${item.descEn || ''}" data-fi="${item.descFi || ''}">
                             ${displayDesc}
                        </p>
                        
                        <button class="btn-add-to-cart w-full py-3 text-black bg-white hover:bg-gray-100 border border-gray-200 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-md"
                                data-item-id="${item.id}">
                            <span class="material-symbols-outlined text-[20px] group-hover/btn:scale-110 transition-transform">add_shopping_cart</span>
                            <span class="btn-text">${addText}</span>
                        </button>
                    </div>
                `;

                // Add click handler
                card.querySelector('.btn-add-to-cart').addEventListener('click', (e) => {
                    if (isLounas && !isLounasTime) {
                        if (window.showNotification) {
                            window.showNotification('Món ăn này chỉ phục vụ vào giờ Lounas (11:00 - 14:30, Thứ 2 - Thứ 6).', 'error');
                        } else {
                            alert('Món ăn này chỉ phục vụ vào giờ Lounas (11:00 - 14:30, Thứ 2 - Thứ 6).');
                        }
                        return;
                    }

                    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
                    if (hasOptions) {
                        showOptionsPopup(item, currentLang);
                    } else {
                        // Fly entire card to cart
                        window.flyToCart(card);
                        const safeName = (item.nameEn || item.nameVi || 'Unknown');
                        window.addToCart(item.id, safeName, item.price || 0, item.image || '', []);
                    }
                });

                menuContainer.appendChild(card);
            });
        }

    } catch (error) {
        console.error("Error loading menu:", error);
        menuContainer.innerHTML = '<div class="col-span-full text-center py-20 text-red-500">Failed to load menu. Please refresh.</div>';
    }
}

function applyMenuTranslations() {
    const lang = localStorage.getItem('selectedLanguage') || 'en';

    document.querySelectorAll('.dynamic-cat-title').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.textContent = text;
    });

    document.querySelectorAll('.dynamic-name').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.textContent = text;
    });

    document.querySelectorAll('.dynamic-desc').forEach(el => {
        const text = el.getAttribute(`data-${lang}`);
        if (text) el.textContent = text;
    });

    const btnText = lang === 'vi' ? 'Thêm vào giỏ' : (lang === 'fi' ? 'Lisää ostoskoriin' : 'Add to Cart');
    document.querySelectorAll('.btn-text').forEach(el => {
        el.textContent = btnText;
    });
}

window.addEventListener('languageChanged', () => {
    applyMenuTranslations();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadMenu);
} else {
    loadMenu();
}
