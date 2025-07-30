// firebase-messaging-sw.js (Version 3 - Robust Click Handling)

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

// THIS HANDLER IS FOR DISPLAYING THE NOTIFICATION
// It runs when the browser is in the background.
messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Received background message. Payload:', payload);

    // The payload contains 'notification' and 'data' objects sent from the server.
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
        // IMPORTANT: We attach the 'data' from the payload to the notification itself.
        data: payload.data 
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// THIS HANDLER IS FOR WHEN THE USER CLICKS THE NOTIFICATION
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked. Event:', event);
    
    // The user clicked the notification, so we should close it.
    event.notification.close();

    // 'event.notification.data' now holds the 'data' object we attached above.
    const urlToOpen = event.notification.data.url;

    // This tells the browser to wait until our task (opening a window) is complete.
    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then(function(clientList) {
            // If a window with the URL is already open, focus it.
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
