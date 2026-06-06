import { db, getApiKeys } from "./firebase-config.js";

const apiKeys = await getApiKeys();

const cartContainer = document.getElementById('cart-items-container');
const emptyMsg = document.getElementById('empty-cart-msg');
const cartTotal = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const btnSubmit = document.getElementById('btn-submit-order');

let debounceTimeout = null;

async function autoCalculateDistance() {
    const address = (document.getElementById('cust-address')?.value || '').trim();
    const statusEl = document.getElementById('distance-calc-status');
    const distanceInput = document.getElementById('cust-distance');
    
    if (address.length === 0) {
        if (statusEl) statusEl.classList.add('hidden');
        return;
    }
    
    // Address must contain at least one number (representing house number or postcode) and have a minimum length
    const hasNumber = /\d/.test(address);
    
    if (!hasNumber || address.length < 5) {
        if (statusEl) {
            statusEl.classList.remove('hidden');
            statusEl.innerHTML = `<span class="text-yellow-400">⚠️ Vui lòng nhập địa chỉ đầy đủ (bao gồm tên đường, số nhà, thành phố).</span>`;
        }
        return;
    }
    
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = `<span class="text-teal-400 font-semibold animate-pulse">⏳ Đang tính toán phí ship...</span>`;
    }
    
    try {
        const apiKey = apiKeys.cerebrasPrimary;
        const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-oss-120b',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert mapping and routing assistant. You must calculate the exact driving distance by car (in kilometers) from Pho Viet Khang Restaurant (Google Maps Coordinates: 60.209794, 25.085506 at Kauppakartanonkatu 3, 00930 Helsinki) to the customer's delivery address.
You must find the actual car driving route distance (not straight-line distance).
The address provided contains the street name, house number, postcode, and city.
Reply with ONLY a valid JSON object containing exactly these keys: "distance" (float) and "reason" (short text). Do not wrap inside code block tags like \`\`\`json.
Example response: {"distance": 5.4, "reason": "Driving route via Route 170"}`
                    },
                    {
                        role: 'user',
                        content: `Delivery Address: "${address}"`
                    }
                ],
                temperature: 0
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const km = parseFloat(parsed.distance);
            
            if (!isNaN(km) && km >= 0) {
                if (distanceInput) {
                    distanceInput.value = km.toFixed(1);
                }
                if (statusEl) {
                    statusEl.innerHTML = `<span class="text-green-400">✅ Distance: ${km.toFixed(1)} km (${parsed.reason})</span>`;
                }
                if (window.renderCartPage) window.renderCartPage();
                return;
            }
        }
        throw new Error("Invalid output format from AI");
    } catch(err) {
        console.error("Cerebras calculation error:", err);
        if (statusEl) {
            statusEl.innerHTML = `<span class="text-red-400">⚠️ Tính toán thất bại. Vui lòng kiểm tra lại địa chỉ hoặc nhập tay khoảng cách.</span>`;
        }
    }
}

function calculateDeliveryFee(distance) {
    const d = parseFloat(distance);
    if (isNaN(d) || d < 0) return 0;
    if (d < 2) {
        return 0;
    } else if (d < 3) {
        return 2.00;
    } else {
        return 2.00 + 0.40 * d;
    }
}

// Expose render function globally so cart.js can trigger it when qty changes
window.renderCartPage = function() {
    const cart = window.getCart();
    cartContainer.innerHTML = '';
    
    if (cart.length === 0) {
        emptyMsg.classList.remove('hidden');
        cartTotal.textContent = '\u20AC0.00';
        document.getElementById('cart-subtotal').textContent = '\u20AC0.00';
        document.getElementById('delivery-fee-container').classList.add('hidden');
        btnSubmit.disabled = true;
        btnSubmit.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    emptyMsg.classList.add('hidden');
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('opacity-50', 'cursor-not-allowed');

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;

        const el = document.createElement('div');
        el.className = "flex items-center gap-4 bg-surface p-4 rounded-xl border border-white/5";
        el.innerHTML = `
            <img src="${item.image}" class="w-20 h-20 object-cover rounded-lg" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500'">
            <div class="flex-1">
                <h4 class="font-bold text-white text-lg">${item.name}</h4>
                ${item.options && item.options.length > 0 ? `<div class="flex flex-wrap gap-1 mt-1">${item.options.map(o => `<span class="text-xs bg-teal-600/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-600/30">${o}</span>`).join('')}</div>` : ''}
                <p class="text-primary font-semibold">\u20AC${item.price.toFixed(2)}</p>
            </div>
            <div class="flex items-center gap-3 bg-surface-container-low rounded-lg p-1 border border-white/10">
                <button onclick="window.updateQty('${item.id}', -1)" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">remove</span></button>
                <span class="w-4 text-center font-bold text-white">${item.qty}</span>
                <button onclick="window.updateQty('${item.id}', 1)" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">add</span></button>
            </div>
            <button onclick="window.removeFromCart('${item.id}')" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors ml-2">
                <span class="material-symbols-outlined">delete</span>
            </button>
        `;
        cartContainer.appendChild(el);
    });

    document.getElementById('cart-subtotal').textContent = `\u20AC${subtotal.toFixed(2)}`;

    const orderType = document.querySelector('input[name="orderType"]:checked')?.value || 'dine-in';
    
    // Validate if appliedPromo is still compatible with selected orderType
    if (appliedPromo && appliedPromo.allowedOrderTypes && appliedPromo.allowedOrderTypes.length > 0) {
        if (!appliedPromo.allowedOrderTypes.includes(orderType)) {
            appliedPromo = null;
            const promoStatus = document.getElementById('promo-status-msg');
            const promoInput = document.getElementById('promo-code-input');
            if (promoInput) promoInput.value = '';
            if (promoStatus) {
                const currentLang = localStorage.getItem('selectedLanguage') || 'vi';
                if (currentLang === 'vi') {
                    promoStatus.textContent = "⚠️ Hình thức đặt hàng đã thay đổi không phù hợp với mã giảm giá.";
                } else if (currentLang === 'fi') {
                    promoStatus.textContent = "⚠️ Tilaustapa muuttui, alennuskoodi poistettiin.";
                } else {
                    promoStatus.textContent = "⚠️ Order type changed, promo code was removed.";
                }
                promoStatus.className = "text-xs mt-1.5 font-medium text-yellow-400";
            }
        }
    }

    let deliveryFee = 0;
    if (orderType === 'delivery') {
        const distance = document.getElementById('cust-distance')?.value || '0';
        deliveryFee = calculateDeliveryFee(distance);
        document.getElementById('delivery-fee-container').classList.remove('hidden');
        document.getElementById('cart-delivery-fee').textContent = `\u20AC${deliveryFee.toFixed(2)}`;
    } else {
        document.getElementById('delivery-fee-container').classList.add('hidden');
    }

    let discountAmount = 0;
    if (appliedPromo) {
        discountAmount = subtotal * (appliedPromo.discountPercent / 100);
        document.getElementById('discount-container').classList.remove('hidden');
        document.getElementById('cart-discount').textContent = `-€${discountAmount.toFixed(2)}`;
    } else {
        document.getElementById('discount-container').classList.add('hidden');
    }

    const total = subtotal + deliveryFee - discountAmount;
    const vatAmount = total * 0.135 / 1.135;
    document.getElementById('cart-vat-amount').textContent = `\u20AC${vatAmount.toFixed(2)}`;
    cartTotal.textContent = `\u20AC${total.toFixed(2)}`;
};

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    if(window.renderCartPage) window.renderCartPage();
    
    const addressInput = document.getElementById('cust-address');
    if (addressInput) {
        addressInput.addEventListener('input', () => {
            if(window.renderCartPage) window.renderCartPage();
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(autoCalculateDistance, 1200);
        });
    }
    const distanceInput = document.getElementById('cust-distance');
    if (distanceInput) {
        distanceInput.addEventListener('input', () => {
            if(window.renderCartPage) window.renderCartPage();
        });
    }

    // Prevent enter key from placing order, use it to call AI instead
    if (checkoutForm) {
        checkoutForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Stop form submission
                
                if (e.target.id === 'cust-address') {
                    clearTimeout(debounceTimeout);
                    autoCalculateDistance();
                }
            }
        });
    }

    // Promo Code Listeners
    const btnApplyPromo = document.getElementById('btn-apply-promo');
    const promoInput = document.getElementById('promo-code-input');
    const promoStatus = document.getElementById('promo-status-msg');
    const emailInput = document.getElementById('cust-email');

    if (btnApplyPromo && promoInput && promoStatus && emailInput) {
        btnApplyPromo.addEventListener('click', async () => {
            const code = promoInput.value.trim().toUpperCase();
            const email = emailInput.value.trim();
            
            promoStatus.className = "text-xs mt-1.5 font-medium";
            promoStatus.classList.remove('hidden');
            
            if (!email) {
                promoStatus.textContent = "⚠️ Vui lòng nhập Email trước khi áp dụng mã.";
                promoStatus.classList.add('text-red-400');
                return;
            }
            if (!code) {
                promoStatus.textContent = "⚠️ Vui lòng nhập mã giảm giá.";
                promoStatus.classList.add('text-red-400');
                return;
            }
            
            promoStatus.textContent = "⌛ Đang kiểm tra...";
            promoStatus.classList.add('text-blue-400');

            try {
                const docSnap = await getDoc(doc(db, "vouchers", code));
                if (!docSnap.exists()) {
                    promoStatus.textContent = "❌ Mã giảm giá không tồn tại.";
                    promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                    appliedPromo = null;
                    if (window.renderCartPage) window.renderCartPage();
                    return;
                }

                const data = docSnap.data();
                if (data.used === true) {
                    promoStatus.textContent = "❌ Mã giảm giá này đã được sử dụng.";
                    promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                    appliedPromo = null;
                    if (window.renderCartPage) window.renderCartPage();
                    return;
                }

                if (data.email && data.email.toLowerCase() !== email.toLowerCase()) {
                    promoStatus.textContent = "❌ Mã giảm giá này không thuộc về email đã nhập.";
                    promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                    appliedPromo = null;
                    if (window.renderCartPage) window.renderCartPage();
                    return;
                }

                // Check Expiration Date
                if (data.expiryDate) {
                    let expiry;
                    if (data.expiryDate.toDate) {
                        expiry = data.expiryDate.toDate();
                    } else {
                        expiry = new Date(data.expiryDate);
                    }
                    if (expiry < new Date()) {
                        promoStatus.textContent = "❌ Mã giảm giá này đã hết hạn.";
                        promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                        appliedPromo = null;
                        if (window.renderCartPage) window.renderCartPage();
                        return;
                    }
                }

                // Check allowed order/dining types
                const orderTypeEl = document.querySelector('input[name="orderType"]:checked');
                const orderType = orderTypeEl ? orderTypeEl.value : 'dine-in';
                if (data.allowedOrderTypes && data.allowedOrderTypes.length > 0) {
                    if (!data.allowedOrderTypes.includes(orderType)) {
                        const typeLabels = {
                            'dine-in': 'Ăn tại bàn (Dine-in)',
                            'takeaway': 'Mang về (Takeaway)',
                            'delivery': 'Giao hàng (Delivery)'
                        };
                        const currentLang = localStorage.getItem('selectedLanguage') || 'vi';
                        if (currentLang === 'vi') {
                            promoStatus.textContent = `❌ Mã giảm giá này chỉ áp dụng cho: ${data.allowedOrderTypes.map(t => typeLabels[t] || t).join(', ')}.`;
                        } else if (currentLang === 'fi') {
                            promoStatus.textContent = `❌ Tämä koodi koskee vain: ${data.allowedOrderTypes.map(t => t === 'dine-in' ? 'Syö paikan päällä' : t === 'delivery' ? 'Kotiinkuljetus' : 'Mukaan').join(', ')}.`;
                        } else {
                            promoStatus.textContent = `❌ This promo code only applies to: ${data.allowedOrderTypes.join(', ')}.`;
                        }
                        promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                        appliedPromo = null;
                        if (window.renderCartPage) window.renderCartPage();
                        return;
                    }
                }

                // Valid!
                appliedPromo = {
                    code: code,
                    discountPercent: data.discountPercent,
                    allowedOrderTypes: data.allowedOrderTypes || []
                };
                
                promoStatus.textContent = `✅ Áp dụng thành công! Giảm ${data.discountPercent}% cho đơn hàng.`;
                promoStatus.className = "text-xs mt-1.5 font-medium text-green-400";
                
                if (window.renderCartPage) window.renderCartPage();

            } catch (err) {
                console.error("Promo validation error:", err);
                promoStatus.textContent = "⚠️ Lỗi khi kiểm tra mã. Vui lòng thử lại.";
                promoStatus.className = "text-xs mt-1.5 font-medium text-red-400";
                appliedPromo = null;
                if (window.renderCartPage) window.renderCartPage();
            }
        });

        // If email is changed, invalidate promo
        emailInput.addEventListener('input', () => {
            if (appliedPromo) {
                appliedPromo = null;
                promoInput.value = '';
                promoStatus.textContent = "⚠️ Email thay đổi, vui lòng áp dụng lại mã giảm giá.";
                promoStatus.className = "text-xs mt-1.5 font-medium text-yellow-400";
                if (window.renderCartPage) window.renderCartPage();
            }
        });
    }
});

let appliedPromo = null;

// Submit Order
const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';
const WORKER_SECRET = apiKeys.workerSecret;

async function sendWorkerEmail(to, subject, html) {
    try {
        const resp = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': WORKER_SECRET,
            },
            body: JSON.stringify({
                action: 'sendEmail',
                args: { to, subject, html }
            }),
        });
        const data = await resp.json();
        console.log("Email status:", data);
        return data;
    } catch(e) {
        console.error("Failed to send email notification:", e);
    }
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = window.getCart();
        if (cart.length === 0) return;

        const customerName = document.getElementById('cust-name').value;
        const customerPhone = document.getElementById('cust-phone').value;
        const customerEmail = document.getElementById('cust-email').value;
        const orderType = document.querySelector('input[name="orderType"]:checked').value;
        const tableNumber = document.getElementById('cust-table').value;
        const address = document.getElementById('cust-address').value;
        const distance = document.getElementById('cust-distance').value;
        const notes = document.getElementById('cust-notes').value;

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        let deliveryFee = 0;
        if (orderType === 'delivery') {
            deliveryFee = calculateDeliveryFee(distance);
        }
        const discountAmount = appliedPromo ? (subtotal * (appliedPromo.discountPercent / 100)) : 0;
        const total = subtotal + deliveryFee - discountAmount;

        const loading = document.getElementById('checkout-loading');
        loading.classList.remove('hidden');
        btnSubmit.disabled = true;

        try {
            const currentLang = localStorage.getItem('selectedLanguage') || 'en';

            const orderData = {
                customerName,
                customerPhone,
                customerEmail,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber : '',
                address: (orderType === 'delivery' || orderType === 'takeaway') ? address : '',
                deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
                distance: orderType === 'delivery' ? parseFloat(distance) : 0,
                notes,
                items: cart,
                totalPrice: total,
                discountPercent: appliedPromo ? appliedPromo.discountPercent : 0,
                discountAmount: discountAmount,
                promoCode: appliedPromo ? appliedPromo.code : '',
                status: 'pending',
                emailConfirmed: false, // Must confirm email first
                language: currentLang, // Save language for KDS ready email
                createdAt: new Date(),
                userId: 'guest'
            };

            const docRef = await addDoc(collection(db, "orders"), orderData);

            if (appliedPromo) {
                await updateDoc(doc(db, "vouchers", appliedPromo.code), {
                    used: true,
                    usedAt: new Date(),
                    orderId: docRef.id
                });
            }
            
            // Build items HTML list for email
            const itemsHtml = cart.map(i => `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${i.name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i.qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(i.price * i.qty).toFixed(2)}€</td>
                </tr>
            `).join('');

            // Localized Wording dictionaries
            const emailTranslations = {
                vi: {
                    subject: `[Phở Việt Khang] Xác nhận đơn hàng của bạn - #${docRef.id.substring(0, 8).toUpperCase()}`,
                    title: "XÁC NHẬN ĐƠN HÀNG CỦA BẠN",
                    intro: `Xin chào <strong>${customerName}</strong>,<br><br>Cảm ơn bạn đã lựa chọn Phở Việt Khang! Đơn hàng của bạn đã được đặt thành công. Vui lòng bấm vào nút bên dưới để xác nhận đơn hàng và chuyển tới nhà bếp bắt đầu chuẩn bị món ăn:`,
                    btnLabel: "XÁC NHẬN ĐƠN HÀNG",
                    headerItem: "Món ăn",
                    headerQty: "SL",
                    headerPrice: "Giá",
                    subtotal: "Tạm tính",
                    deliveryFee: "Phí giao hàng",
                    vatLabel: "Trong đó VAT (13.5%)",
                    totalLabel: "Tổng thanh toán (Đã gồm 13.5% VAT)",
                    orderId: "Mã đơn hàng",
                    serviceType: "Hình thức phục vụ",
                    address: "Địa chỉ",
                    distance: "Khoảng cách",
                    notes: "Ghi chú",
                    footer: "Phở Việt Khang © 2026. Bảo lưu mọi quyền."
                },
                en: {
                    subject: `[Phở Việt Khang] Confirm Your Order - #${docRef.id.substring(0, 8).toUpperCase()}`,
                    title: "CONFIRM YOUR ORDER",
                    intro: `Hi <strong>${customerName}</strong>,<br><br>Thank you for choosing Phở Việt Khang! Your order has been placed. Please click the button below to confirm your order and start preparation in the kitchen:`,
                    btnLabel: "CONFIRM ORDER",
                    headerItem: "Item",
                    headerQty: "Qty",
                    headerPrice: "Price",
                    subtotal: "Subtotal",
                    deliveryFee: "Delivery Fee",
                    vatLabel: "Of which VAT (13.5%)",
                    totalLabel: "Total (Includes 13.5% VAT)",
                    orderId: "Order ID",
                    serviceType: "Service Type",
                    address: "Address",
                    distance: "Distance",
                    notes: "Notes",
                    footer: "Phở Việt Khang © 2026. All rights reserved."
                },
                fi: {
                    subject: `[Phở Việt Khang] Vahvista tilauksesi - #${docRef.id.substring(0, 8).toUpperCase()}`,
                    title: "VAHVISTA TILAUKSESI",
                    intro: `Hei <strong>${customerName}</strong>,<br><br>Kiitos, että valitsit Phở Việt Khangin! Tilauksesi on tehty. Vahvista tilauksesi klikkaamalla alla olevaa painiketta aloittaaksesi valmistuksen keittiössä:`,
                    btnLabel: "VAHVISTA TILAUS",
                    headerItem: "Tuote",
                    headerQty: "Määrä",
                    headerPrice: "Hinta",
                    subtotal: "Välisumma",
                    deliveryFee: "Toimitusmaksu",
                    vatLabel: "Josta ALV (13.5%)",
                    totalLabel: "Yhteensä (Sisältää 13.5% ALV)",
                    orderId: "Tilaustunnus",
                    serviceType: "Palvelutyyppi",
                    address: "Osoite",
                    distance: "Etäisyys",
                    notes: "Lisätiedot",
                    footer: "Phở Việt Khang © 2026. Kaikki oikeudet pidätetään."
                }
            };

            const langData = emailTranslations[currentLang] || emailTranslations['en'];

            const subtotalHtml = `
                <tr>
                    <td colspan="2" style="padding: 10px; text-align: right; border-top: 1px solid #eee;">${langData.subtotal}:</td>
                    <td style="padding: 10px; text-align: right; border-top: 1px solid #eee;">${subtotal.toFixed(2)}€</td>
                </tr>
            `;
            const deliveryFeeHtml = orderType === 'delivery' ? `
                <tr>
                    <td colspan="2" style="padding: 10px; text-align: right;">${langData.deliveryFee}:</td>
                    <td style="padding: 10px; text-align: right;">${deliveryFee.toFixed(2)}€</td>
                </tr>
            ` : '';

            const discountLabel = currentLang === 'vi' ? `Giảm giá (${appliedPromo?.discountPercent}%)` : currentLang === 'fi' ? `Alennus (${appliedPromo?.discountPercent}%)` : `Discount (${appliedPromo?.discountPercent}%)`;
            const discountHtml = appliedPromo ? `
                <tr>
                    <td colspan="2" style="padding: 10px; text-align: right; color: #10b981;">${discountLabel}:</td>
                    <td style="padding: 10px; text-align: right; color: #10b981;">-${discountAmount.toFixed(2)}€</td>
                </tr>
            ` : '';

            const vatAmountVal = total * 0.135 / 1.135;
            const vatHtml = `
                <tr>
                    <td colspan="2" style="padding: 10px; text-align: right; color: #777; font-size: 0.9em; border-top: 1px solid #eee;">${langData.vatLabel}:</td>
                    <td style="padding: 10px; text-align: right; color: #777; font-size: 0.9em; border-top: 1px solid #eee;">${vatAmountVal.toFixed(2)}€</td>
                </tr>
            `;

            const confirmLink = `${window.location.origin}/confirm-order.html?orderId=${docRef.id}`;

            // Build full confirmation template
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #3b82f6; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">PHỞ VIỆT KHANG - ${langData.title}</h2>
                    <p>${langData.intro}</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmLink}" style="background-color: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.25);">${langData.btnLabel}</a>
                    </div>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; text-align: left;">${langData.headerItem}</th>
                                <th style="padding: 10px; text-align: center;">${langData.headerQty}</th>
                                <th style="padding: 10px; text-align: right;">${langData.headerPrice}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            ${subtotalHtml}
                            ${deliveryFeeHtml}
                            ${discountHtml}
                            ${vatHtml}
                            <tr>
                                <td colspan="2" style="padding: 10px; font-weight: bold; text-align: right;">${langData.totalLabel}:</td>
                                <td style="padding: 10px; font-weight: bold; text-align: right; color: #3b82f6; font-size: 1.2em;">${total.toFixed(2)}€</td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px;">
                        <p style="margin: 0; font-size: 0.9em; color: #555;"><strong>${langData.orderId}</strong> #${docRef.id.toUpperCase()}</p>
                        <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${langData.serviceType}:</strong> ${orderType === 'dine-in' ? `Dine-in (Table ${tableNumber})` : orderType === 'delivery' ? 'Delivery' : 'Takeaway'}</p>
                        ${(orderType === 'delivery' || orderType === 'takeaway') && address ? `<p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${langData.address}</strong> ${address}</p>` : ''}
                        ${orderType === 'delivery' && distance ? `<p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${langData.distance}</strong> ${distance} km</p>` : ''}
                        ${notes ? `<p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${langData.notes}</strong> ${notes}</p>` : ''}
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px; font-size: 0.8em; color: #999;">${langData.footer}</p>
                </div>
            `;

            // Trigger worker to send transactional email
            await sendWorkerEmail(customerEmail, langData.subject, emailHtml);

            // Clear cart
            window.clearCart();
            
            // Store order ID locally
            let myOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
            myOrders.push(docRef.id);
            localStorage.setItem('my_orders', JSON.stringify(myOrders));

            // Create and show success modal
            const modalHtml = `
                <div id="success-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                    <div class="bg-surface p-8 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl transform scale-95 transition-all duration-300 opacity-0" id="success-modal-content">
                        <!-- Icon -->
                        <div class="mx-auto w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-blue-400">
                            <span class="material-symbols-outlined text-4xl animate-pulse">mail</span>
                        </div>
                        
                        <!-- Content -->
                        <div class="space-y-3">
                            <h3 class="text-2xl font-bold text-white font-['EB_Garamond']">ĐANG CHỜ XÁC NHẬN</h3>
                            <p class="text-secondary text-sm">
                                Một email xác nhận đơn hàng đã được gửi tới địa chỉ của bạn:
                            </p>
                            <p class="text-primary font-mono text-sm break-all bg-primary/10 py-1.5 px-3 rounded-lg border border-primary/20 select-all font-semibold">
                                ${customerEmail}
                            </p>
                            <p class="text-yellow-400/90 text-xs mt-2 font-medium">
                                💡 Nhắc nhở: Vui lòng click vào liên kết "Xác nhận đơn hàng" trong email để chuẩn bị món ăn.
                            </p>
                            
                            <!-- Development Quick Confirmation Link -->
                            <div class="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
                                <p class="text-[11px] text-blue-400 font-bold uppercase mb-1">🛠️ Link xác nhận nhanh (Môi trường Dev):</p>
                                <a href="${confirmLink}" target="_blank" class="text-[11px] text-primary hover:underline break-all block font-mono">${confirmLink}</a>
                            </div>
                        </div>

                        <!-- Button -->
                        <div class="pt-2 space-y-3">
                            <button id="btn-go-to-history" class="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-300">
                                Tôi đã xác nhận trong email
                            </button>
                            <p id="error-feedback" class="text-red-400 text-xs hidden font-medium">⚠️ Hệ thống chưa nhận được xác nhận từ email của bạn. Vui lòng bấm liên kết trong thư trước.</p>
                        </div>
                    </div>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.innerHTML = modalHtml;
            const modalEl = wrapper.firstElementChild;
            document.body.appendChild(modalEl);

            // Animate in
            setTimeout(() => {
                const content = document.getElementById('success-modal-content');
                if (content) {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }
            }, 50);

            // Redirect on click
            document.getElementById('btn-go-to-history').addEventListener('click', async () => {
                const feedbackEl = document.getElementById('error-feedback');
                const btnEl = document.getElementById('btn-go-to-history');
                
                feedbackEl.classList.add('hidden');
                btnEl.disabled = true;
                btnEl.textContent = "Đang kiểm tra...";

                try {
                    const docSnap = await getDoc(doc(db, "orders", docRef.id));
                    if (docSnap.exists() && docSnap.data().emailConfirmed === true) {
                        const content = document.getElementById('success-modal-content');
                        if (content) {
                            content.classList.add('scale-95', 'opacity-0');
                        }
                        setTimeout(() => {
                            modalEl.remove();
                            window.location.href = `order-tracking.html?orderId=${docRef.id}`;
                        }, 200);
                    } else {
                        feedbackEl.classList.remove('hidden');
                        btnEl.disabled = false;
                        btnEl.textContent = "Tôi đã xác nhận trong email";
                    }
                } catch(err) {
                    console.error("Check confirmation failed", err);
                    feedbackEl.textContent = "⚠️ Lỗi hệ thống khi kiểm tra xác nhận. Vui lòng thử lại.";
                    feedbackEl.classList.remove('hidden');
                    btnEl.disabled = false;
                    btnEl.textContent = "Tôi đã xác nhận trong email";
                }
            });

        } catch (error) {
            console.error("Order submission error:", error);
            window.showNotification('Failed to place order. Please try again.', 'error');
        } finally {
            loading.classList.add('hidden');
            btnSubmit.disabled = false;
        }
    });
}
