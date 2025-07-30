importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js');

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

messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Received background message. Payload:', payload);
    // The browser will automatically display the notification based on the payload.
});

self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked. Event:', event);
    event.notification.close();

    // Try to get the URL from click_action, data.url, or fcm_options.link
    let urlToOpen = event.notification.click_action || 
                    (event.notification.data && event.notification.data.url) || 
                    (event.notification.data && event.notification.data.FCM_MSG && event.notification.data.FCM_MSG.notification.link);

    // Fallback URL if none is provided
    if (!urlToOpen) {
        urlToOpen = 'https://www.example.com'; // Replace with your default URL
    }

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
            // Check if the URL is already open in any client
            for (let client of clientsArr) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        }).catch(err => {
            console.error('[SW] Error opening URL:', err);
        })
    );
});
