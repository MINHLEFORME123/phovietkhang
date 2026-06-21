import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app-check.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCdrnjnOD2yvQm1WhQvL-G1FuZyatnDyZk",
    authDomain: "phovietkhang.firebaseapp.com",
    databaseURL: "https://phovietkhang-default-rtdb.firebaseio.com",
    projectId: "phovietkhang",
    storageBucket: "phovietkhang.firebasestorage.app",
    messagingSenderId: "402866883241",
    appId: "1:402866883241:web:c5aa837183dc2ecafcf7b8",
    measurementId: "G-N59CLB4GMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase App Check (Enterprise Security)
// LƯU Ý: Thay 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY' bằng mã Site Key từ Firebase Console
const recaptchaSiteKey = 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY';
if (recaptchaSiteKey && recaptchaSiteKey !== 'YOUR_RECAPTCHA_ENTERPRISE_SITE_KEY') {
    try {
        const appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
            isTokenAutoRefreshEnabled: true
        });
    } catch (e) {
        console.warn("App Check failed to initialize:", e);
    }
} else {
    console.log("App Check skipped: Site key is not configured.");
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

let apiKeysCache = null;
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function getApiKeys() {
    if (apiKeysCache) return apiKeysCache;
    try {
        const docSnap = await getDoc(doc(db, "config", "apiKeys"));
        if (docSnap.exists()) {
            apiKeysCache = docSnap.data();
            return apiKeysCache;
        }
    } catch(e) {
        console.error("Error loading API keys", e);
    }
    return {};
}
