import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="material-symbols-outlined animate-spin mr-2">sync</span> Sending...`;
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const phone = document.getElementById('contact-phone').value;
            const message = document.getElementById('contact-message').value;
            
            try {
                await addDoc(collection(db, "feedback"), {
                    name,
                    email,
                    phone,
                    message,
                    status: 'unread',
                    createdAt: new Date()
                });
                
                document.getElementById('form-success').classList.remove('hidden');
                contactForm.reset();
            } catch (err) {
                console.error("Error sending message: ", err);
                if (window.showNotification) {
                    window.showNotification("Error sending message. Please try again later.", "error");
                } else {
                    alert("Error sending message. Please try again later.");
                }
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnText;
            }
        });
    }
});
