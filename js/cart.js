// js/cart.js - Handles localStorage cart state + fly-to-cart animation

let cart = JSON.parse(localStorage.getItem('phoCart')) || [];

function saveCart() {
    localStorage.setItem('phoCart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const counts = document.querySelectorAll('#cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    
    counts.forEach(badge => {
        badge.textContent = totalItems;
        if (totalItems > 0) {
            badge.classList.remove('hidden');
            badge.style.animation = 'none';
            badge.offsetHeight;
            badge.style.animation = 'cartBounce 0.5s ease';
        } else {
            badge.classList.add('hidden');
        }
    });
}

// --- Fly-to-Cart Animation ---
// cardEl: the DOM card element to clone and fly
window.flyToCart = function(cardEl) {
    const cartIcon = document.querySelector('#cart-count')?.parentElement 
                  || document.querySelector('a[href="cart.html"]');
    if (!cartIcon || !cardEl || !cardEl.getBoundingClientRect) return;

    const cartRect = cartIcon.getBoundingClientRect();
    const endX = cartRect.left + cartRect.width / 2;
    const endY = cartRect.top + cartRect.height / 2;

    const startRect = cardEl.getBoundingClientRect();
    const startX = startRect.left;
    const startY = startRect.top;
    const startW = startRect.width;
    const startH = startRect.height;

    // Clone the entire card visually
    const flyer = cardEl.cloneNode(true);
    flyer.style.cssText = `
        position: fixed;
        z-index: 99999;
        left: ${startX}px;
        top: ${startY}px;
        width: ${startW}px;
        height: ${startH}px;
        pointer-events: none;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        transition: none;
        transform-origin: center center;
    `;
    document.body.appendChild(flyer);

    // Gentle arc midpoint
    const midX = startX + (endX - startX) * 0.5;
    const midY = Math.min(startY, endY) - 50;

    const keyframes = [
        { 
            left: `${startX}px`, 
            top: `${startY}px`, 
            width: `${startW}px`, 
            height: `${startH}px`,
            opacity: 1,
            borderRadius: '16px',
            transform: 'scale(1)'
        },
        { 
            left: `${midX - 40}px`, 
            top: `${midY}px`, 
            width: '80px', 
            height: '80px',
            opacity: 0.8,
            borderRadius: '50%',
            transform: 'scale(0.5)'
        },
        { 
            left: `${endX - 15}px`, 
            top: `${endY - 15}px`, 
            width: '30px', 
            height: '30px',
            opacity: 0,
            borderRadius: '50%',
            transform: 'scale(0.1)'
        }
    ];

    const animation = flyer.animate(keyframes, {
        duration: 1200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
    });

    animation.onfinish = () => {
        flyer.remove();
        cartIcon.style.animation = 'none';
        cartIcon.offsetHeight;
        cartIcon.style.animation = 'cartShake 0.4s ease';
    };
};

// Inject animation CSS
const cartAnimStyle = document.createElement('style');
cartAnimStyle.textContent = `
    @keyframes cartBounce {
        0% { transform: translate(4px, -4px) scale(1); }
        30% { transform: translate(4px, -4px) scale(1.6); }
        50% { transform: translate(4px, -4px) scale(0.8); }
        70% { transform: translate(4px, -4px) scale(1.2); }
        100% { transform: translate(4px, -4px) scale(1); }
    }
    @keyframes cartShake {
        0%, 100% { transform: rotate(0deg); }
        20% { transform: rotate(-12deg); }
        40% { transform: rotate(10deg); }
        60% { transform: rotate(-6deg); }
        80% { transform: rotate(4deg); }
    }
`;
document.head.appendChild(cartAnimStyle);


window.addToCart = function(id, name, price, image, selectedOptions) {
    const optKey = selectedOptions && selectedOptions.length > 0 ? selectedOptions.sort().join('|') : '';
    const uniqueId = optKey ? `${id}__${optKey}` : id;

    const existing = cart.find(i => i.id === uniqueId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id: uniqueId, rawId: id, name, price, image, qty: 1, options: selectedOptions || [] });
    }
    saveCart();
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    if (window.renderCartPage) window.renderCartPage();
};

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    saveCart();
    if (window.renderCartPage) window.renderCartPage();
};

window.clearCart = function() {
    cart = [];
    saveCart();
    if (window.renderCartPage) window.renderCartPage();
};

window.getCart = function() {
    return cart;
};

document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});
