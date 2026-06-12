import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

window.loadLuckyWheelSettings = async function () {
    try {
        const snap = await getDoc(doc(db, "config", "luckyWheel"));
        const data = snap.exists() ? snap.data() : {};
        const guarantee = data.guarantee || {};
        const next20El = document.getElementById('lw-next20-target');
        const next50El = document.getElementById('lw-next50-target');
        const next100El = document.getElementById('lw-next100-target');
        if (next20El) next20El.textContent = guarantee.next20 ?? "--";
        if (next50El) next50El.textContent = guarantee.next50 ?? "--";
        if (next100El) next100El.textContent = guarantee.next100 ?? "--";
    } catch (e) {
        console.error("Failed to load lucky wheel config:", e);
    }
};

window.luckyWheelAdmin = {
    async resetAllCounters() {
        try {
            await setDoc(doc(db, "config", "luckyWheel"), {
                guarantee: {
                    totalSpins: 0,
                    next20: 20,
                    next50: 50,
                    next100: 100
                }
            }, { merge: true });
            window.showNotification("ÄÃ£ reset bá»™ Ä‘áº¿m guarantee vá» 0.", "success");
            await window.loadLuckyWheelSettings();
        } catch (e) {
            window.showNotification("Lá»—i reset: " + e.message, "error");
        }
    }
};

window.loadLuckyWheelSettings();
