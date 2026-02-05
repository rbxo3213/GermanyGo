// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 1. Initialize Firebase in the Service Worker
// NOTE: You must replace these with your actual Firebase config values or rely on "default" if hosting on Firebase Hosting.
// Since we are not on standard Firebase Hosting (likely Vercel), we must explicitly pass config.
// However, service workers don't have access to process.env. 
// We will rely on the Messaging SDK caching the config or hardcode the PUBLIC keys here.
// Given security (API keys are public anyway), it's safe to hardcode the config here.
// I will fetch the config from .env.local via a tool read in previous steps
// BUT WAIT! I don't want to hardcode values in this generated file if I can avoid it.
// Standard practice: "firebase-messaging-sw.js" 
// Actually, `firebase-messaging-sw.js` often needs the config. 
// Let's use `self.addEventListener('push')` manual handling? 
// No, the Firebase SDK helper is better.

firebase.initializeApp({
    apiKey: "AIzaSyAeYRo2fsZuYmMbJNNGbC1nedy3AInUjY0",
    authDomain: "germanygo-393f3.firebaseapp.com",
    projectId: "germanygo-393f3",
    storageBucket: "germanygo-393f3.firebasestorage.app",
    messagingSenderId: "973311005127",
    appId: "1:973311005127:web:436055a167a6f48021c9e2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Custom handling if needed, but if payload has 'notification' key, browser handles it automatically.
    // Calling showNotification here causes DOUBLE notifications.

    /* 
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192x192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
    */
});
