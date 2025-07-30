// firebase-messaging-sw.js (Final Version with Click Handler)

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

// This handler runs when a notification is received in the background.
// It is responsible for DISPLAYING the notification.
messaging.onBackgroundMessage(function(payload) {
    console.log('[SW] Received background message ', payload);

    // Get the data from the payload.
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
        // Pass the URL to the notification's data property.
        data: {
            url: payload.data.url 
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// This handler runs when the user CLICKS on the notification.
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification click received.', event);
    
    event.notification.close(); // Close the notification pop-up

    // Get the URL from the notification's data field.
    const urlToOpen = event.notification.data.url;

    // Use event.waitUntil to keep the service worker alive
    // until the new window is open.
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // If a window for this URL is already open, focus it.
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
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
