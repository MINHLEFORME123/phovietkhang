importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const data = payload.notification || payload.data || {};
    const notificationTitle = data.title || 'Phở Việt Khang';
    const notificationOptions = {
        body: data.body || '',
        icon: '/images/logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
