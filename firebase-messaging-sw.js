// firebase-messaging-sw.js

// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker with your config
const firebaseConfig = {
    apiKey: "AIzaSyCnzPX3Ugtsj6cGpRccFsOTaUrf3Bs0t6k",
    authDomain: "mypushapp-7bb12.firebaseapp.com",
    projectId: "mypushapp-7bb12",
    storageBucket: "mypushapp-7bb12.firebasestorage.app",
    messagingSenderId: "356045560168",
    appId: "1:356045560168:web:42866a1e94118d6a40dedd",
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// AFTER
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // The 'data' payload now directly contains the custom data sent from the server.
  // We can access the link with payload.data.link
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
    data: {
        // This is the correct way to access the link
        url: payload.fcmOptions.link
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add a 'notificationclick' event listener
self.addEventListener('notificationclick', function(event) {
    event.notification.close(); // Close the notification

    const urlToOpen = event.notification.data.url;
    
    // This looks for an existing window and focuses it if it exists
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});