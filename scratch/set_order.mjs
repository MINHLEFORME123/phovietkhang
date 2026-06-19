import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const newOrder = [
    "Phở",
    "Salad",
    "Súp",
    "Khai vị",
    "Món chính kèm Cơm",
    "Cơm rang",
    "Mì Xào",
    "Phở xào",
    "Đặc sản Việt",
    "Đồ uống"
].map(c => c.trim());

async function run() {
    try {
        console.log("Cập nhật danh mục trên config/menu...");
        await setDoc(doc(db, "config", "menu"), { categoryOrder: newOrder }, { merge: true });
        console.log("Cập nhật thành công!");
        process.exit(0);
    } catch(e) {
        console.error("Lỗi:", e);
        process.exit(1);
    }
}
run();
