/**
 * MyPush - Self-Hosted Push Notification Service (DEBUGGING VERSION)
 */
(function () {
    console.log("DEBUG 1: push-init.js script started.");

    const YOUR_SERVER_URL = "https://my-push-service.onrender.com";
    const host = window.location.host;

    function initializeFirebaseMessaging(firebaseConfig, vapidKey) {
        console.log("DEBUG 6: initializeFirebaseMessaging() called.");
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const messaging = firebase.messaging();
        messaging.usePublicVapidKey(vapidKey);
        console.log("DEBUG 7: Firebase messaging initialized.");

        window.myPushRequestAndRegister = function () {
            // ... (rest of function is fine) ...
        };
    }

    var firebaseAppScript = document.createElement("script");
    firebaseAppScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
    document.head.appendChild(firebaseAppScript);

    firebaseAppScript.onload = function () {
        console.log("DEBUG 2: firebase-app.js has loaded.");
        var messagingScript = document.createElement("script");
        messagingScript.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js";
        document.head.appendChild(messagingScript);

        messagingScript.onload = function () {
            console.log("DEBUG 3: firebase-messaging.js has loaded. Fetching config...");
            fetch(`${YOUR_SERVER_URL}/api/get-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ domain: host }),
            })
            .then(res => {
                console.log("DEBUG 4: Received response from /api/get-config.");
                return res.json().catch(() => null);
            })
            .then(config => {
                console.log("DEBUG 5: Parsed config object:", config);
                if (!config || !config.roll_services) { // More specific check
                    console.log("MyPush: Config object is missing or doesn't have roll_services. Stopping.");
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
                    console.log("DEBUG 8: Config has roll_services. Calling initRoll().");
                    initRoll(config.roll_services);
                } else {
                    console.log("DEBUG 8b: Config does NOT have roll_services object. Not calling initRoll().");
                }
            })
            .catch(err => console.error("MyPush DEBUG: A critical error occurred in fetch chain:", err));
        };
    };
    
    // --- UI WIDGET CODE ---
    let updateSubUI; 
    const injectRoll = () => {
        console.log("DEBUG 10: injectRoll() called.");
        // --- PASTE YOUR FULL `injectRoll` function code here ---
    };
    const initRoll = (cfg) => {
        console.log("DEBUG 9: initRoll() called with config:", cfg);
        // --- PASTE YOUR FULL `initRoll` function code here ---
    };
    
    // --- FOR THIS TO WORK, YOU MUST PASTE THE FULL CODE FOR `injectRoll` AND `initRoll` back in here ---
    // --- from the file I provided in the previous "Complete file" response ---

})();
