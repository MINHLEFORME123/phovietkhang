import { db, getApiKeys } from "./firebase-config.js";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const apiKeys = await getApiKeys();
const CLOUDFLARE_WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';
const WORKER_SECRET = apiKeys.workerSecret;

async function sendOrderReadyEmail(orderId, order) {
    if (!order.customerEmail) return;
    const orderLang = order.language || 'en';
    const readyTranslations = {
        vi: {
            subject: `[Phở Việt Khang] Đơn hàng của bạn đã sẵn sàng! - #${orderId.substring(0, 8).toUpperCase()}`,
            title: "ĐƠN HÀNG ĐÃ SẴN SÀNG",
            intro: `Xin chào <strong>${order.customerName || 'Quý khách'}</strong>,<br><br>Tin vui! Đơn hàng của bạn tại Phở Việt Khang đã được chế biến xong và sẵn sàng phục vụ.`,
            summaryHeader: "Chi tiết đơn hàng:",
            totalLabel: "Tổng cộng",
            serviceType: "Hình thức",
            orderId: "Mã đơn hàng",
            footer: "Cảm ơn quý khách đã ủng hộ nhà hàng. Phở Việt Khang © 2026."
        },
        en: {
            subject: `[Phở Việt Khang] Your Order is Ready! - #${orderId.substring(0, 8).toUpperCase()}`,
            title: "YOUR ORDER IS READY",
            intro: `Hi <strong>${order.customerName || 'Customer'}</strong>,<br><br>Great news! Your order at Phở Việt Khang is ready and waiting for you.`,
            summaryHeader: "Here is a summary of your order:",
            totalLabel: "Total Price",
            serviceType: "Service Type",
            orderId: "Order ID",
            footer: "Thank you for dining with us! Phở Việt Khang © 2026."
        },
        fi: {
            subject: `[Phở Việt Khang] Tilauksesi on valmis! - #${orderId.substring(0, 8).toUpperCase()}`,
            title: "TILAUKSESI ON VALMIS",
            intro: `Hei <strong>${order.customerName || 'Asiakas'}</strong>,<br><br>Hienoja uutisia! Tilauksesi Phở Việt Khangissa on valmis ja odottaa sinua.`,
            summaryHeader: "Tässä on yhteenveto tilauksestasi:",
            totalLabel: "Yhteensä",
            serviceType: "Palvelutyyppi",
            orderId: "Tilaustunnus",
            footer: "Kiitos asioinnistasi kanssamme! Phở Việt Khang © 2026."
        }
    };

    const rData = readyTranslations[orderLang] || readyTranslations['en'];
    const itemsHtml = (order.items || []).map(i => `
        <li style="margin-bottom: 5px;"><strong>${i.qty}x</strong> ${i.name}</li>
    `).join('');

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #10b981; text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px;">${rData.title}</h2>
            <p>${rData.intro}</p>
            
            <p><strong>${rData.summaryHeader}</strong></p>
            <ul style="padding-left: 20px; margin: 15px 0;">
                ${itemsHtml}
            </ul>
            
            <p style="font-size: 1.1em;"><strong>${rData.totalLabel}:</strong> <span style="color: #10b981; font-weight: bold;">${(order.totalPrice || 0).toFixed(2)}€</span></p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 20px; border: 1px solid #e9ecef;">
                <p style="margin: 0; font-size: 0.9em; color: #555;"><strong>${rData.serviceType}:</strong> ${order.orderType === 'dine-in' ? `Dine-in (Table ${order.tableNumber || 'N/A'})` : order.orderType === 'delivery' ? 'Delivery' : 'Takeaway'}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.9em; color: #555;"><strong>${rData.orderId}:</strong> #${orderId.toUpperCase()}</p>
            </div>
            
            <p style="margin-top: 25px;">${rData.footer}</p>
        </div>
    `;

    try {
        await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Secret': WORKER_SECRET,
            },
            body: JSON.stringify({
                action: 'sendEmail',
                args: { to: order.customerEmail, subject: rData.subject, html: emailHtml }
            }),
        });
    } catch(e) {
        console.error("Failed to send ready email:", e);
    }
}

const orderBoard = document.getElementById('order-board');
if (orderBoard) {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        orderBoard.innerHTML = '';
        let pending = 0; let cooking = 0; let ready = 0;
        
        let activeOrders = [];
        snapshot.forEach((docSnap) => {
            const order = docSnap.data();
            if (["pending", "cooking", "ready"].includes(order.status) && (order.emailConfirmed === true || order.emailConfirmed === undefined)) {
                let date = null;
                if (order.createdAt && typeof order.createdAt.toDate === 'function') {
                    date = order.createdAt.toDate();
                } else if (order.createdAt) {
                    date = new Date(order.createdAt);
                }
                activeOrders.push({
                    id: docSnap.id,
                    date: date || new Date(0),
                    ...order
                });
            }
        });

        // Sort ascending by creation time so oldest active orders appear first
        activeOrders.sort((a, b) => a.date - b.date);

        if (activeOrders.length === 0) {
            orderBoard.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 text-xl">No active orders</div>';
            document.getElementById('pending-count').textContent = '0';
            document.getElementById('cooking-count').textContent = '0';
            document.getElementById('ready-count').textContent = '0';
            return;
        }

        activeOrders.forEach((order) => {
            if (order.status === 'pending') pending++;
            if (order.status === 'cooking') cooking++;
            if (order.status === 'ready') ready++;

            const card = document.createElement('div');
            let borderColor = 'border-red-500';
            let statusColor = 'red';
            
            if (order.status === 'cooking') {
                borderColor = 'border-yellow-500';
                statusColor = 'yellow';
            } else if (order.status === 'ready') {
                borderColor = 'border-green-500';
                statusColor = 'green';
            }
            
            card.className = `border-2 rounded-lg p-4 bg-gray-900 ${borderColor}`;
            
            let itemsHtml = order.items.map(i => `
                <div class="flex justify-between border-b border-gray-700 py-2">
                    <span class="font-bold">${i.qty}x</span> 
                    <span>${i.name}</span>
                </div>
            `).join('');

            let buttonsHtml = '';
            if (order.status === 'pending') {
                buttonsHtml = `
                    <button onclick="window.updateOrderStatus('${order.id}', 'cooking')" class="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded">COOK</button>
                    <button onclick="window.updateOrderStatus('${order.id}', 'ready')" class="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded">READY</button>
                `;
            } else if (order.status === 'cooking') {
                buttonsHtml = `
                    <button onclick="window.updateOrderStatus('${order.id}', 'ready')" class="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded text-sm">READY</button>
                `;
            } else if (order.status === 'ready') {
                buttonsHtml = `
                    <button onclick="window.updateOrderStatus('${order.id}', 'completed')" class="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded text-sm">COMPLETE</button>
                `;
            }

            card.innerHTML = `
                <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <span class="text-xl font-bold">Order #${order.id.substring(0,5).toUpperCase()}</span>
                    <span class="text-sm bg-gray-800 px-2 py-1 rounded text-${statusColor}-400 uppercase font-bold">${order.status}</span>
                </div>
                <div class="mb-4 text-lg">${itemsHtml}</div>
                ${order.notes ? `<div class="mb-4 text-sm text-gray-400 italic">Notes: ${order.notes}</div>` : ''}
                <div class="flex gap-2">
                    ${buttonsHtml}
                </div>
            `;
            orderBoard.appendChild(card);
        });

        document.getElementById('pending-count').textContent = pending;
        document.getElementById('cooking-count').textContent = cooking;
        document.getElementById('ready-count').textContent = ready;
    }, (error) => {
        console.error("Error listening to orders:", error);
    });

    window.updateOrderStatus = async function(id, newStatus) {
        try {
            await updateDoc(doc(db, "orders", id), { status: newStatus });
            
            if (newStatus === 'ready') {
                const docSnap = await getDoc(doc(db, "orders", id));
                if (docSnap.exists()) {
                    await sendOrderReadyEmail(id, docSnap.data());
                }
            }
        } catch(e) {
            console.error("Error updating status", e);
        }
    };
}
