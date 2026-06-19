import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const dishes = [
    { nameVi: "Cơm rang", nameEn: "Fried Rice", nameFi: "Paistettu riisi" },
    { nameVi: "Mì xào", nameEn: "Fried Noodles", nameFi: "Paistetut nuudelit" },
    { nameVi: "Phở xào", nameEn: "Stir-fried Pho", nameFi: "Paistettu Pho" }
];

async function run() {
    try {
        console.log("Bắt đầu thêm 3 món ăn vào Firestore...");
        for (const d of dishes) {
            await addDoc(collection(db, "menu"), {
                nameVi: d.nameVi,
                nameEn: d.nameEn,
                nameFi: d.nameFi,
                price: 14.9,
                categoryVi: "Món Chính",
                categoryEn: "Main Courses",
                categoryFi: "Pääruoat",
                descVi: d.nameVi + " thơm ngon với lựa chọn đồ ăn kèm (không tính thêm phí).",
                descEn: "Delicious " + d.nameEn + " with your choice of protein.",
                descFi: "Herkullinen " + d.nameFi + " valitsemallasi proteiinilla.",
                imageUrl: "",
                isAvailable: true,
                options: [
                    {
                        nameVi: "Chọn đồ ăn kèm",
                        nameEn: "Choose a side",
                        nameFi: "Valitse lisuke",
                        type: "single",
                        choices: [
                            { labelVi: "Gà", labelEn: "Chicken", labelFi: "Kana", price: 0 },
                            { labelVi: "Gà tẩm bột", labelEn: "Crispy Chicken", labelFi: "Rapea kana", price: 0 },
                            { labelVi: "Đậu phụ", labelEn: "Tofu", labelFi: "Tofu", price: 0 },
                            { labelVi: "Xá xíu", labelEn: "Char Siu", labelFi: "Char Siu", price: 0 },
                            { labelVi: "Thịt bò", labelEn: "Beef", labelFi: "Nauta", price: 0 }
                        ]
                    }
                ]
            });
            console.log("✅ Đã thêm: " + d.nameVi);
        }
        console.log("Thêm thành công tất cả 3 món!");
        process.exit(0);
    } catch(e) {
        console.error("Lỗi:", e);
        process.exit(1);
    }
}
run();
