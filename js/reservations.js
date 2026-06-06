import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const resForm = document.getElementById('reservation-form');
    if (resForm) {
        resForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = resForm.querySelector('button[type="submit"]');
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin mr-2">sync</span> Processing...`;
            
            const name = document.getElementById('res-name').value;
            const phone = document.getElementById('res-phone').value;
            const email = document.getElementById('res-email').value;
            const date = document.getElementById('res-date').value;
            const time = document.getElementById('res-time').value;
            const guests = document.getElementById('res-guests').value;
            const location = document.getElementById('res-location').value;
            const notes = document.getElementById('res-notes').value;
            
            try {
                await addDoc(collection(db, "reservations"), {
                    name,
                    phone,
                    email,
                    date,
                    time,
                    guests: parseInt(guests),
                    location,
                    notes,
                    status: 'pending',
                    createdAt: new Date()
                });
                
                document.getElementById('res-success').classList.remove('hidden');
                resForm.reset();
            } catch (err) {
                console.error("Error adding reservation: ", err);
                if (window.showNotification) {
                    window.showNotification("Error submitting reservation. Please try again later.", "error");
                } else {
                    alert("Error submitting reservation. Please try again later.");
                }
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }
        });
    }
});
