import { db, getApiKeys } from "./firebase-config.js";
import { addDoc, collection, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const cartContainer = document.getElementById('cart-items-container');
const emptyMsg = document.getElementById('empty-cart-msg');
const cartTotal = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const btnSubmit = document.getElementById('btn-submit-order');

let debounceTimeout = null;
let _apiKeysPromise = null;

async function getCachedApiKeys() {
    if (!_apiKeysPromise) _apiKeysPromise = getApiKeys();
    return _apiKeysPromise;
}

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
        const keys = await getCachedApiKeys();
        const apiKey = keys.cerebrasPrimary;
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

function getSelectedPaymentMethod() {
    return document.querySelector('input[name="paymentMethod"]:checked')?.value || 'online_banking_fi';
}

function getPaymentMethodLabel(method, lang = 'en') {
    const labels = {
        online_banking_fi: {
            vi: 'Online banking (Finland)',
            en: 'Online banking (Finland)',
            fi: 'Verkkopankki (Suomi)'
        },
        mobilepay: {
            vi: 'MobilePay',
            en: 'MobilePay',
            fi: 'MobilePay'
        },
        bank_card: {
            vi: 'Thẻ ngân hàng',
            en: 'Bank Card',
            fi: 'Pankkikortti'
        }
    };

    return labels[method]?.[lang] || labels[method]?.en || method;
}

let appliedPromo = null;

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
        const itemPrice = Number.parseFloat(item.price) || 0;
        const itemQty = Number.parseInt(item.qty, 10) || 1;
        const itemOptions = Array.isArray(item.options) ? item.options : [];
        const itemImage = typeof item.image === 'string' ? item.image : '';
        const itemName = typeof item.name === 'string' && item.name ? item.name : 'Unknown';
        const itemId = typeof item.id === 'string' ? item.id : '';
        const itemTotal = itemPrice * itemQty;
        subtotal += itemTotal;

        const el = document.createElement('div');
        el.className = "flex items-center gap-4 bg-surface p-4 rounded-xl border border-white/5";
        el.innerHTML = `
            <img src="${itemImage}" class="w-20 h-20 object-cover rounded-lg" onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=500'">
            <div class="flex-1">
                <h4 class="font-bold text-white text-lg">${itemName}</h4>
                ${itemOptions.length > 0 ? `<div class="flex flex-wrap gap-1 mt-1">${itemOptions.map(o => `<span class="text-xs bg-teal-600/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-600/30">${o}</span>`).join('')}</div>` : ''}
                <p class="text-primary font-semibold">\u20AC${itemPrice.toFixed(2)}</p>
            </div>
            <div class="flex items-center gap-3 bg-surface-container-low rounded-lg p-1 border border-white/10">
                <button onclick="window.updateQty('${itemId}', -1)" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">remove</span></button>
                <span class="w-4 text-center font-bold text-white">${itemQty}</span>
                <button onclick="window.updateQty('${itemId}', 1)" class="w-8 h-8 flex items-center justify-center text-secondary hover:text-white hover:bg-white/10 rounded-md transition-colors"><span class="material-symbols-outlined text-sm">add</span></button>
            </div>
            <button onclick="window.removeFromCart('${itemId}')" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors ml-2">
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

// Initial render (DOM is already parsed since module is deferred)
if (window.renderCartPage) window.renderCartPage();
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

const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';

async function sendWorkerEmail(to, subject, html) {
    try {
        const keys = await getCachedApiKeys();
        const resp = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': keys.workerSecret,
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

async function createPaytrailPayment(orderData) {
    try {
        const keys = await getCachedApiKeys();
        const resp = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': keys.workerSecret,
            },
            body: JSON.stringify({
                action: 'createPaytrailPayment',
                args: { orderData }
            }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Paytrail API error');
        return data;
    } catch(e) {
        console.error("Paytrail payment creation failed:", e);
        throw e;
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
        const paymentMethod = getSelectedPaymentMethod();
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
            const paymentMethodLabel = getPaymentMethodLabel(paymentMethod, currentLang);

            const orderData = {
                customerName,
                customerPhone,
                customerEmail,
                orderType,
                paymentMethod,
                paymentMethodLabel,
                paymentStatus: 'pending',
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
                language: currentLang,
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

            // Redirect to Paytrail payment gateway
            try {
                const paytrailResult = await createPaytrailPayment({
                    id: docRef.id,
                    total: total,
                    customerEmail: customerEmail,
                    customerName: customerName,
                    customerPhone: customerPhone,
                    paymentMethod: paymentMethod,
                    items: cart,
                    deliveryFee: deliveryFee,
                    discountAmount: discountAmount,
                    createdAt: new Date().toISOString(),
                    language: currentLang,
                });

                // Save Paytrail transaction reference
                await updateDoc(doc(db, "orders", docRef.id), {
                    paytrailTransactionId: paytrailResult.transactionId,
                    paytrailCheckoutUrl: paytrailResult.checkoutUrl,
                    paymentStatus: 'redirected',
                });

                // Save order to history & clear cart
                const savedOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
                savedOrders.push(docRef.id);
                localStorage.setItem('my_orders', JSON.stringify(savedOrders));
                if (typeof window.clearCart === 'function') window.clearCart();

                // Redirect to Paytrail checkout
                window.location.href = paytrailResult.checkoutUrl;
                return;
            } catch (err) {
                console.error("Paytrail payment failed:", err);
                window.showNotification('Kết nối thanh toán thất bại. Vui lòng thử lại.', 'error');
                loading.classList.add('hidden');
                btnSubmit.disabled = false;
                return;
            }

        } catch (error) {
            console.error("Order submission error:", error);
            window.showNotification('Failed to place order. Please try again.', 'error');
        } finally {
            loading.classList.add('hidden');
            btnSubmit.disabled = false;
        }
    });
}
