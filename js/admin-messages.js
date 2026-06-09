import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    addDoc, 
    setDoc, 
    doc, 
    deleteDoc, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const recipientSelect = document.getElementById('msg-recipient');
const attachVoucherCheck = document.getElementById('attach-voucher-check');
const voucherConfigSection = document.getElementById('voucher-config-section');
const composeForm = document.getElementById('message-compose-form');
const messagesTableBody = document.getElementById('messages-table-body');

let allUsersMap = {}; // uid -> user details (email, name)

const attachSpinCheck = document.getElementById('attach-spin-check');
const spinConfigSection = document.getElementById('spin-config-section');

// Toggle voucher configs
if (attachVoucherCheck && voucherConfigSection) {
    attachVoucherCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            voucherConfigSection.classList.remove('hidden');
        } else {
            voucherConfigSection.classList.add('hidden');
        }
    });
}

// Toggle spin configs
if (attachSpinCheck && spinConfigSection) {
    attachSpinCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            spinConfigSection.classList.remove('hidden');
        } else {
            spinConfigSection.classList.add('hidden');
        }
    });
}

// Format Date
function formatAdminMsgDate(timestamp) {
    if (!timestamp) return '';
    const d = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleString('vi-VN');
}

// Fetch all registered users
async function loadUsersDropdown() {
    try {
        const qSnap = await getDocs(collection(db, "users"));
        recipientSelect.innerHTML = '<option value="all">Tất cả khách hàng (Broadcast)</option>';
        qSnap.forEach(docSnap => {
            const data = docSnap.data();
            allUsersMap[docSnap.id] = data;
            
            const option = document.createElement('option');
            option.value = docSnap.id;
            option.textContent = `${data.name || 'No Name'} (${data.email || 'No Email'})`;
            recipientSelect.appendChild(option);
        });
    } catch (err) {
        console.error("Failed to load users for dropdown:", err);
    }
}

// Listen to sent messages list in real-time
function setupSentMessagesListener() {
    onSnapshot(collection(db, "messages"), (snapshot) => {
        messagesTableBody.innerHTML = '';
        const list = [];
        
        snapshot.forEach(docSnap => {
            list.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        // Sort newest first
        list.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        if (list.length === 0) {
            messagesTableBody.innerHTML = `
                <tr><td colspan="6" class="p-4 text-center text-secondary">Chưa có tin nhắn nào được gửi.</td></tr>
            `;
            return;
        }

        list.forEach(msg => {
            let recipientText = 'Tất cả khách hàng';
            if (msg.recipientId !== 'all') {
                const u = allUsersMap[msg.recipientId];
                recipientText = u ? `${u.name} (${u.email})` : `User (${msg.recipientId})`;
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-800 text-secondary hover:bg-surface-highlight/20 transition-colors';
            tr.innerHTML = `
                <td class="py-3 px-4 text-white font-medium">${msg.title}</td>
                <td class="py-3 px-4">${recipientText}</td>
                <td class="py-3 px-4">
                    ${msg.imageUrl ? `<a href="${msg.imageUrl}" target="_blank" class="text-primary hover:underline flex items-center gap-1"><span class="material-symbols-outlined text-sm">image</span>Xem ảnh</a>` : 'Không có'}
                </td>
                <td class="py-3 px-4">
                    ${msg.voucherCode ? `<div class="mb-1"><span class="bg-primary/10 border border-primary/20 text-primary font-mono font-bold px-2 py-1 rounded text-xs select-all">${msg.voucherCode}</span></div>` : ''}
                    ${msg.giftSpins ? `<span class="bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold px-2 py-1 rounded text-[10px] uppercase tracking-wider">+${msg.giftSpins.count} Lượt quay (${msg.giftSpins.type === 'deu' ? 'Thường' : msg.giftSpins.type === 'xin' ? 'Xịn' : 'VIP'})</span>` : ''}
                    ${!msg.voucherCode && !msg.giftSpins ? 'Không có' : ''}
                </td>
                <td class="py-3 px-4">${formatAdminMsgDate(msg.createdAt)}</td>
                <td class="py-3 px-4">
                    <button class="text-red-400 hover:text-red-300 flex items-center gap-0.5 hover:bg-red-500/10 px-2.5 py-1 rounded transition-colors" data-delete-id="${msg.id}">
                        <span class="material-symbols-outlined text-sm">delete</span> Xoá
                    </button>
                </td>
            `;

            // Handle delete action
            tr.querySelector('button[data-delete-id]').addEventListener('click', async (e) => {
                if (confirm(`Bạn có chắc chắn muốn xoá tin nhắn "${msg.title}" này không?`)) {
                    try {
                        await deleteDoc(doc(db, "messages", msg.id));
                    } catch (err) {
                        window.showNotification("Xoá tin nhắn thất bại: " + err.message, 'error');
                    }
                }
            });

            messagesTableBody.appendChild(tr);
        });
    });
}

// Form Compose Submit
if (composeForm) {
    composeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recipient = document.getElementById('msg-recipient').value;
        const title = document.getElementById('msg-title').value.trim();
        const text = document.getElementById('msg-text').value.trim();
        const imageUrl = document.getElementById('msg-image-url').value.trim();
        const createVoucher = attachVoucherCheck.checked;
        const discountPercent = parseInt(document.getElementById('voucher-percent').value, 10);
        const attachSpin = attachSpinCheck.checked;
        const spinType = document.getElementById('spin-type-select').value;
        const spinCount = parseInt(document.getElementById('spin-count-input').value, 10) || 1;
        const btnSend = document.getElementById('btn-send-msg');

        btnSend.disabled = true;
        btnSend.innerHTML = `<span class="material-symbols-outlined animate-spin text-lg">sync</span> Đang gửi...`;

        try {
            const { getDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            let voucherCode = '';
            
            // 1. Create voucher if checked
            if (createVoucher) {
                const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
                voucherCode = `PROMO${discountPercent}-${rand}`;
                
                // Get target email for voucher lock (empty if broadcast/all)
                let targetEmail = '';
                if (recipient !== 'all') {
                    const targetUser = allUsersMap[recipient];
                    targetEmail = targetUser ? targetUser.email : '';
                }

                // Calculate expiry Date
                const durationDays = document.getElementById('voucher-duration').value;
                let expiryDate = null;
                if (durationDays !== 'never') {
                    const days = parseInt(durationDays, 10);
                    expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + days);
                }

                // Get allowed order types
                const allowedOrderTypes = [];
                if (document.getElementById('voucher-type-dine-in').checked) allowedOrderTypes.push('dine-in');
                if (document.getElementById('voucher-type-takeaway').checked) allowedOrderTypes.push('takeaway');
                if (document.getElementById('voucher-type-delivery').checked) allowedOrderTypes.push('delivery');

                await setDoc(doc(db, "vouchers", voucherCode), {
                    code: voucherCode,
                    discountPercent: discountPercent,
                    email: targetEmail, // empty represents generic code
                    used: false,
                    allowedOrderTypes: allowedOrderTypes,
                    expiryDate: expiryDate,
                    createdAt: new Date()
                });
            }

            // 1.5 Give spins if checked
            let giftSpinsObj = null;
            if (attachSpin) {
                giftSpinsObj = { type: spinType, count: spinCount };
                if (recipient === 'all') {
                    // Broadcast spin to all users
                    const allUsersSnap = await getDocs(collection(db, "users"));
                    const updatePromises = [];
                    allUsersSnap.forEach(uDoc => {
                        const userData = uDoc.data();
                        const spins = userData.spins || { deu: 0, xin: 0, vip: 0 };
                        spins[spinType] = (spins[spinType] || 0) + spinCount;
                        updatePromises.push(updateDoc(doc(db, "users", uDoc.id), { spins }));
                    });
                    await Promise.all(updatePromises);
                } else {
                    // Single recipient
                    const userRef = doc(db, "users", recipient);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const spins = userData.spins || { deu: 0, xin: 0, vip: 0 };
                        spins[spinType] = (spins[spinType] || 0) + spinCount;
                        await updateDoc(userRef, { spins });
                    }
                }
            }

            // 2. Create message
            const messageData = {
                title,
                text,
                imageUrl: imageUrl || null,
                voucherCode: voucherCode || null,
                giftSpins: giftSpinsObj,
                recipientId: recipient,
                createdAt: new Date()
            };

            if (recipient === 'all') {
                messageData.readBy = [];
            } else {
                messageData.read = false;
            }

            await addDoc(collection(db, "messages"), messageData);
            
            // 3. Reset form
            composeForm.reset();
            if (attachVoucherCheck) {
                attachVoucherCheck.checked = false;
                voucherConfigSection.classList.add('hidden');
            }
            if (attachSpinCheck) {
                attachSpinCheck.checked = false;
                spinConfigSection.classList.add('hidden');
            }
            window.showNotification("Đã gửi tin nhắn thành công!", 'success');

        } catch (err) {
            console.error("Submit message error:", err);
            window.showNotification("Lỗi khi gửi tin nhắn: " + err.message, 'error');
        } finally {
            btnSend.disabled = false;
            btnSend.innerHTML = `<span class="material-symbols-outlined text-lg">send</span> Gửi tin nhắn`;
        }
    });
}

// Access check & initialization
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadUsersDropdown();
        setupSentMessagesListener();
    } else {
        window.location.href = "../login.html";
    }
});
