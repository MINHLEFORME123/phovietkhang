import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Utility to show errors
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

// Document-level event delegation for login and registration forms
document.addEventListener('submit', async (e) => {
    // 1. Register Logic
    if (e.target && e.target.id === 'register-form') {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            sessionStorage.setItem('pendingWelcomeSpin', 'true');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Save extra user info in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: "customer", // Default role
                spins: { deu: 1, xin: 0, vip: 0 },
                createdAt: new Date()
            });
        } catch (error) {
            sessionStorage.removeItem('pendingWelcomeSpin');
            showError('register-error', error.message);
        }
    }

    // 2. Login Logic
    if (e.target && e.target.id === 'login-form') {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showError('login-error', "Invalid email or password.");
        }
    }
});

// Google Auth Logic via click delegation
document.addEventListener('click', async (e) => {
    const btnGoogle = e.target.closest('#btn-google');
    if (btnGoogle) {
        const provider = new GoogleAuthProvider();
        try {
            sessionStorage.setItem('pendingWelcomeSpin', 'true');
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: user.displayName || 'Google User',
                    email: user.email,
                    role: "customer",
                    spins: { deu: 1, xin: 0, vip: 0 },
                    createdAt: new Date()
                });
            }
        } catch (error) {
            console.error("Google Auth Error", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                window.showNotification("Google Sign-In Failed: " + error.message, 'error');
            }
        }
    }
});

// 3. Auth State Listener & UI Update / Route Protection
onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname.toLowerCase();
    const isLoginOrRegister = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');

    window.currentUserUid = user ? user.uid : null;

    if (user) {
        // Migrate guest cart to user cart
        const guestCart = JSON.parse(localStorage.getItem('phoCart_guest') || '[]');
        if (guestCart.length > 0) {
            const userCart = JSON.parse(localStorage.getItem('phoCart_' + user.uid) || '[]');
            const merged = [...userCart];
            guestCart.forEach(guestItem => {
                const existing = merged.find(i => i.id === guestItem.id);
                if (existing) {
                    existing.qty += guestItem.qty;
                } else {
                    merged.push(guestItem);
                }
            });
            localStorage.setItem('phoCart_' + user.uid, JSON.stringify(merged));
            localStorage.removeItem('phoCart_guest');
            // Reload cart in memory if cart module loaded
            if (typeof window.getCart !== 'undefined') {
                const cart = window.getCart();
                cart.length = 0;
                cart.push(...merged);
                if (typeof window.saveCart === 'function') window.saveCart();
            }
        }

        // User is signed in

        // Update navigation UI on client pages
        const registerBtns = document.querySelectorAll('[data-i18n="nav-register"]');
        const userIcons = document.querySelectorAll('a[href="login.html"]');

        registerBtns.forEach(btn => {
            // Hide Register button when logged in (avatar serves as profile link)
            btn.style.display = 'none';
        });

        userIcons.forEach(icon => {
            const prefix = (currentPath.includes('/admin/') || currentPath.includes('/kitchen/') || currentPath.includes('/host/')) ? '../' : '';
            icon.href = prefix + "profile.html";
            const iconSpan = icon.querySelector('.material-symbols-outlined');
            if (iconSpan) {
                const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
                icon.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#3b82f6;color:#fff;font-weight:700;font-size:16px;font-family:Inter,sans-serif;">' + initial + '</span>';
            }
        });

        const queryUnread = query(
            collection(db, "messages"),
            where("recipientId", "in", ["all", user.uid])
        );
        onSnapshot(queryUnread, (snapshot) => {
            let hasUnread = false;
            snapshot.forEach(docSnap => {
                const msg = docSnap.data();
                const read = msg.recipientId === 'all'
                    ? (Array.isArray(msg.readBy) && msg.readBy.includes(user.uid))
                    : msg.read === true;
                if (!read) hasUnread = true;
            });
            const badgeNav = document.getElementById('inbox-badge-nav');
            const badgeNavMobile = document.getElementById('inbox-badge-nav-mobile');
            if (badgeNav) {
                if (hasUnread) {
                    badgeNav.classList.remove('hidden');
                } else {
                    badgeNav.classList.add('hidden');
                }
            }
            if (badgeNavMobile) {
                if (hasUnread) {
                    badgeNavMobile.classList.remove('hidden');
                } else {
                    badgeNavMobile.classList.add('hidden');
                }
            }
        });

        // Fetch role and handle routing
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let role = 'customer';
            const isNewUser = sessionStorage.getItem('pendingWelcomeSpin') === 'true';
            if (userDoc.exists()) {
                role = userDoc.data().role || 'customer';
                sessionStorage.removeItem('pendingWelcomeSpin');
            }

            // Route Protection
            const prefix = (currentPath.includes('/admin/') || currentPath.includes('/kitchen/') || currentPath.includes('/host/')) ? '../' : '';

            if (currentPath.includes('/admin/') && role !== 'admin') {
                window.location.href = prefix + "index.html"; // Kick out
                return;
            }
            if (currentPath.includes('/kitchen/') && role !== 'admin' && role !== 'kitchen') {
                window.location.href = prefix + "index.html"; // Kick out
                return;
            }
            if (currentPath.includes('/host/') && role !== 'admin' && role !== 'host') {
                window.location.href = prefix + "index.html"; // Kick out
                return;
            }

            // Login Redirect
            if (isLoginOrRegister) {
                if (isNewUser) {
                    showWelcomeSpinModal(user.email, role);
                } else {
                    if (role === 'admin') window.location.href = "admin/index.html";
                    else if (role === 'kitchen') window.location.href = "kitchen/index.html";
                    else if (role === 'host') window.location.href = "host/index.html";
                    else window.location.href = "index.html";
                }
            }

        } catch (error) {
            console.error("Error fetching user role:", error);
        }

    } else {
        // User is signed out
        const protectedPages = ['profile.html', 'order-history.html'];
        const isProtectedClientPage = protectedPages.some(page => currentPath.endsWith(page));
        const isAppPage = currentPath.includes('/admin/') || currentPath.includes('/kitchen/') || currentPath.includes('/host/');

        const prefix = isAppPage ? '../' : '';

        if (isProtectedClientPage || isAppPage) {
            window.location.href = prefix + "login.html";
        }
    }
});

// 4. Logout
export async function logoutUser() {
    try {
        const currentPath = window.location.pathname.toLowerCase();
        const prefix = (currentPath.includes('/admin/') || currentPath.includes('/kitchen/') || currentPath.includes('/host/')) ? '../' : '';
        await signOut(auth);
        window.location.href = prefix + "index.html";
    } catch (error) {
        console.error("Logout Error", error);
    }
}
window.logoutUser = logoutUser;

// --- REGISTRATION WELCOME VOUCHERS FLOW ---
function showWelcomeSpinModal(userEmail, role) {
    if (document.getElementById('welcome-spin-modal')) return;

    const modalHtml = `
        <div id="welcome-spin-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div class="bg-[#121824] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl transform scale-95 transition-all duration-300 opacity-0" id="welcome-spin-content">
                <div class="mx-auto w-20 h-20 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined text-5xl animate-spin" style="animation-duration: 3s;">casino</span>
                </div>
                
                <div class="space-y-2">
                    <h3 class="text-2xl font-bold text-white font-['EB_Garamond']">QUÀ CHÀO MỪNG THÀNH VIÊN!</h3>
                    <p class="text-secondary text-sm">
                        Chào mừng bạn đến với <strong>Phở Việt Khang</strong>. Chúc mừng bạn đã nhận được <strong class="text-primary text-base uppercase">1 Lượt Quay May Mắn</strong> từ chúng tôi!
                    </p>
                </div>

                <button id="btn-go-spin" class="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2">
                    <span>Đến Vòng Quay Ngay</span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    const modalEl = wrapper.firstElementChild;
    document.body.appendChild(modalEl);

    setTimeout(() => {
        const content = document.getElementById('welcome-spin-content');
        if (content) {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }
    }, 50);

    document.getElementById('btn-go-spin').addEventListener('click', async () => {
        const btn = document.getElementById('btn-go-spin');
        btn.disabled = true;
        btn.innerHTML = `<span class="material-symbols-outlined animate-spin align-middle mr-1">sync</span> Đang tải...`;

        try {
            const currentLang = localStorage.getItem('selectedLanguage') || 'vi';
            const welcomeMsgLang = {
                vi: {
                    title: "Quà tặng chào mừng thành viên mới! 🎁",
                    text: "Chào mừng bạn đến với Phở Việt Khang! Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi đã tặng bạn 1 Lượt quay may mắn (Vòng quay Lucky Wheel). Hãy thử vận may của bạn ngay tại trang cá nhân nhé! Chúc bạn có những trải nghiệm ẩm thực tuyệt vời!",
                },
                en: {
                    title: "Welcome New Member! 🎁",
                    text: "Welcome to Phở Việt Khang! Thank you for registering. We have gifted you 1 Lucky Wheel spin. Try your luck now on your profile page! Wish you an excellent dining experience!",
                },
                fi: {
                    title: "Tervetuloa uusi jäsen! 🎁",
                    text: "Tervetuloa Phở Việt Khangiin! Kiitos rekisteröitymisestä. Olemme lahjoittaneet sinulle 1 Onnenpyörä-pyöräytyksen. Kokeile onneasi nyt profiilisivullasi! Toivomme sinulle erinomaista ruokailukokemusta!",
                }
            };
            const welcomeText = welcomeMsgLang[currentLang] || welcomeMsgLang['vi'];

            await addDoc(collection(db, "messages"), {
                title: welcomeText.title,
                text: welcomeText.text,
                imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=600",
                recipientId: auth.currentUser ? auth.currentUser.uid : "",
                createdAt: new Date(),
                read: false
            });
        } catch (err) {
            console.error("Failed to write welcome message:", err);
        }

        if (role === 'admin') window.location.href = "admin/index.html";
        else if (role === 'kitchen') window.location.href = "kitchen/index.html";
        else if (role === 'host') window.location.href = "host/index.html";
        else window.location.href = "profile.html#wheel";
    });
}
// Intercept inbox link click if not logged in
document.addEventListener('click', (e) => {
    const inboxLink = e.target.closest('a[href*="inbox.html"]');
    if (inboxLink) {
        if (!auth.currentUser) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'login.html';
        }
    }
}, true);
