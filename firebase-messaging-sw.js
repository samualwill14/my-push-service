// firebase-messaging-sw.js (Final, Robust Version)

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyCnzPX3Ugtsj6cGpRccFsOTaUrf3Bs0t6k",
    authDomain: "mypushapp-7bb12.firebaseapp.com",
    projectId: "mypushapp-7bb12",
    storageBucket: "mypushapp-7bb12.firebasestorage.app",
    messagingSenderId: "356045560168",
    appId: "1:356045560168:web:42866a1e94118d6a40dedd",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// The onBackgroundMessage handler is only needed if you want to customize
// the notification before it's displayed. For just showing what the server sends,
// this can even be omitted, but we'll keep it for logging.
messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Received background message. Payload:', payload);
    // The browser will automatically display the notification based on the payload.
});

// This listener provides a fallback and ensures the URL opens correctly.
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked. Event:', event);
    event.notification.close();

    // The click_action URL is part of the event.notification object.
    const urlToOpen = event.notification.click_action;

    if (urlToOpen) {
        event.waitUntil(clients.openWindow(urlToOpen));
    }
});
