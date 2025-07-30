/**
 * MyPush - Self-Hosted Push Notification Service
 * This is the client-side installer script.
 */
(function () {
    // ===================================================================================
    //  CONFIGURATION - IMPORTANT!
    //  Change this to the URL of your backend server.
    // ===================================================================================
    const YOUR_SERVER_URL = "https://my-push-service.onrender.com"; // <-- ❗ CHANGE THIS ❗
    // ===================================================================================

    const host = window.location.host;

    function initializeFirebaseMessaging(firebaseConfig, vapidKey) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const messaging = firebase.messaging();
        messaging.usePublicVapidKey(vapidKey);

        window.myPushRequestAndRegister = function () {
            console.log('Requesting permission...');
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Permission granted.');
                    return messaging.getToken();
                } else {
                    console.warn('Permission denied.');
                    if (document.getElementById('rollSubscribeBtn')) {
                       updateSubUI();
                    }
                    throw new Error('Permission denied');
                }
            }).then(token => {
                if (!token) throw new Error("Failed to get FCM token.");
                console.log('FCM Token obtained, sending to server...');
                return fetch(`${YOUR_SERVER_URL}/api/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: token, domain: host }),
                });
            }).then(response => {
                if (!response.ok) throw new Error('Server responded with an error.');
                console.log('Token registered successfully.');
            }).catch((err) => {
                console.error('An error occurred during push registration: ', err);
            });
        };
    }

    var firebaseAppScript = document.createElement("script");
    firebaseAppScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
    document.head.appendChild(firebaseAppScript);

    firebaseAppScript.onload = function () {
        var messagingScript = document.createElement("script");
        messagingScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js";
        document.head.appendChild(messagingScript);

        messagingScript.onload = function () {
            fetch(`${YOUR_SERVER_URL}/api/get-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: host }),
            })
            .then(res => res.json().catch(() => null))
            .then(config => {
                if (!config) {
                    console.log("MyPush: No configuration found for this domain.");
                    return;
                }

                const myFirebaseConfig = {
                    apiKey: "AIzaSyCnzPX3Ugtsj6cGpRccFsOTaUrf3Bs0t6k",
                    authDomain: "mypushapp-7bb12.firebaseapp.com",
                    projectId: "mypushapp-7bb12",
                    storageBucket: "mypushapp-7bb12.firebasestorage.app",
                    messagingSenderId: "356045560168",
                    appId: "1:356045560168:web:42866a1e94118d6a40dedd",
                };
                const myVapidKey = "BIwpDzoqv4CoqDFREUHIK6mI5N9FEXdxkDMIJiDXRmY7Zm-b31CR3Mys4nM6c4170F25oosEVCjIe2OJqcbHnI4";

                initializeFirebaseMessaging(myFirebaseConfig, myVapidKey);

                if (config.roll_services && typeof config.roll_services === 'object') {
                    initRoll(config.roll_services);
                }
            })
            .catch(err => console.error("MyPush: Error fetching config from server:", err));
        };
    };
    
    // --- UI WIDGET CODE ---
    let updateSubUI; 
    const injectRoll = () => { /* ... Omitted for brevity, paste your injectRoll code here ... */ };
    const initRoll = (cfg) => { /* ... Omitted for brevity, paste your initRoll code here ... */ };

    // --- PASTE YOUR FULL `injectRoll` and `initRoll` functions here ---
    // Make sure they are inside the main `(function() { ... })();` block

})();
