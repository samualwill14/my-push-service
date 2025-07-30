/**
 * MyPush - Self-Hosted Push Notification Service
 * (Restored to last known working version for showing the bell icon)
 */
(function () {
    // ===================================================================================
    //  CONFIGURATION
    // ===================================================================================
    const YOUR_SERVER_URL = "https://my-push-service.onrender.com"; // Set to your live server URL
    // ===================================================================================

    const host = window.location.host;

    function initializeFirebaseMessaging(firebaseConfig, vapidKey) {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const messaging = firebase.messaging();

        window.myPushRequestAndRegister = function () {
            console.log('Requesting permission for push notifications...');
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    return messaging.getToken({ vapidKey });
                } else {
                    console.warn('User denied permission for notifications.');
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
                console.log('Token registered successfully with our server.');
            }).catch((err) => {
                console.error('An error occurred during push registration: ', err);
            });
        };
    }

    var firebaseAppScript = document.createElement("script");
    firebaseAppScript.src = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
    document.head.appendChild(firebaseAppScript);

    firebaseAppScript.onload = function () {
        var messagingScript = document.createElement("script");
        messagingScript.src = "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js";
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

    let updateSubUI;
    const injectRoll = () => {
        if (document.getElementById("newsroll-style")) return;
        const style = document.createElement("style");
        style.id = "newsroll-style";
        style.textContent = `
            .newsroll-container { position: fixed; bottom: 50px; right: 20px; font-family: Arial, sans-serif; z-index: 100000; display: flex; flex-direction: column; align-items: flex-end; }
            .newsroll-icon { background-color: #007bff; color: #fff; padding: 8px; border-radius: 50%; cursor: pointer; width: 40px; height: 40px; font-size: 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); animation: bounce 2s infinite; margin-top: 20px; }
            @keyframes bounce { 0%,20%,50%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} 60%{transform:translateY(-5px)} }
            .newsroll-icon:hover { opacity: 0.8; }
            .newsroll-card { display: none; flex-direction: column; width: 320px; max-width:100%; background:#fff; border:1px solid #007bff; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.2); overflow:hidden; margin-top:10px; }
            .newsroll-header { background: #007bff; color: #fff; padding: 15px 10px; position: relative; text-align: center; line-height: 20px; }
            .newsroll-header h5 { margin:0; font-size:16px; }
            .newsroll-header .close-button { position:absolute; top:8px; right:8px; background:none; border:none; color:#fff; font-size:20px; cursor:pointer; }
            .newsroll-body { padding:10px; min-height:300px; max-height:450px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }
            .newsroll-list-item { display:flex; gap:10px; padding:5px; border:1px solid #f0f0f0; border-radius:5px; text-decoration:none; align-items:center; transition:background-color 0.3s; }
            .newsroll-list-item:hover { background-color:#f9f9f9; }
            .newsroll-list-item img { width:100px; height:64px; object-fit:cover; border-radius:5px; flex-shrink:0; object-position:top; }
            .newsroll-desc { flex-grow:1; display:flex; flex-direction:column; overflow:hidden; }
            .newsroll-desc p { margin:0; font-size:12px; color:#000; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
            .newsroll-date { font-size:10px; color:#777; margin-top:4px; }
            .newsroll-footer { padding:10px; border-top:1px solid #f0f0f0; text-align:center; }
            .newsroll-button { background:#007bff; color:#fff; border:none; border-radius:5px; padding:8px 12px; font-size:14px; width:auto; cursor:pointer; transition:background-color 0.3s; }
            .newsroll-button:hover { opacity: 0.8; }
            .loading-spinner { display:none; border:4px solid #f3f3f3; border-top:4px solid #007bff; border-radius:50%; width:24px; height:24px; animation:spin 1s linear infinite; margin:10px auto; }
            @keyframes spin { 0%{transform:rotate(0)}100%{transform:rotate(360deg)} }
            .subscription-message { text-align:center; font-size:14px; padding:5px; }
            .subscription-message.success { color:green; }
            .subscription-message.denied { color:red; }
            @media (max-width:768px) { .newsroll-card{width:300px; right:5%;} }
        `;
        document.head.appendChild(style);

        const tpl = document.createElement("template");
        tpl.innerHTML = `
            <div class="newsroll-container" id="newsrollContainer">
              <div class="newsroll-card" id="newsrollCard">
                <div class="newsroll-header" id="newsroll-header">
                  <h5 class="newsroll-title">News</h5>
                  <button class="close-button" id="rollCloseBtn" aria-label="Close">×</button>
                </div>
                <div class="newsroll-body" id="newsrollBody"></div>
                <div class="loading-spinner" id="rollSpinner"></div>
                <div class="newsroll-footer">
                  <button class="newsroll-button" id="rollSubscribeBtn">Subscribe to Notifications</button>
                  <div class="subscription-message" id="rollSubMsg"></div>
                </div>
              </div>
              <div class="newsroll-icon" id="newsrollIcon" tabindex="0" aria-label="Open News" role="button">
                <i id="newsrollIconIco"></i>
              </div>
            </div>`;
        document.body.appendChild(tpl.content);
    };

    const initRoll = (cfg) => {
        injectRoll();

        const icon = document.getElementById("newsrollIcon");
        const iconIco = document.getElementById("newsrollIconIco");
        const card = document.getElementById("newsrollCard");
        const closeBtn = document.getElementById("rollCloseBtn");
        const body = document.getElementById("newsrollBody");
        const spinner = document.getElementById("rollSpinner");
        const subscribeBtn = document.getElementById("rollSubscribeBtn");
        const subJonah = document.getElementById("rollSubMsg");
        const newsrollHeader = document.getElementById("newsroll-header");

        let loaded = false;

        const svgMap = {
            "fa-bell": `<svg viewBox="0 0 24 24" fill="currentColor" width="1.5em" height="1.5em"><path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zM18 16v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 1 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2A1 1 0 0 0 5 20h14a1 1 0 0 0 .99-1.99L18 16z"/></svg>`,
            "fa-newspaper": `<svg viewBox="0 0 24 24" fill="currentColor" width="1.5em" height="1.5em"><path d="M19 3H4c-1.1 0-2 .9-2 2v14h2V5h15V3zm1 4H8c-1.1 0-2 .9-2 2v12h16V9c0-1.1-.9-2-2-2zm-4 3h4v2h-4v-2zm-8 0h6v2h-6v-2zm0 4h10v2H8v-2z"/></svg>`,
        };
        iconIco.innerHTML = svgMap[cfg.icon] || svgMap['fa-bell'];

        const themeColor = cfg.theme || "#007bff";
        icon.style.backgroundColor = themeColor;
        newsrollHeader.style.backgroundColor = themeColor;
        card.style.borderColor = themeColor;
        spinner.style.borderTopColor = themeColor;
        subscribeBtn.style.backgroundColor = themeColor;
        subscribeBtn.style.borderColor = themeColor;
        
        if (cfg.position === "bottom-left") {
            const container = document.getElementById("newsrollContainer");
            container.style.left = "20px";
            container.style.right = "auto";
            container.style.alignItems = "flex-start";
        }

        document.querySelector(".newsroll-title").textContent = cfg.title || "News";

        const getRelativeTime = (date) => {
            const now = new Date(), diff = Math.floor((now - date) / 1000);
            if (diff < 60) return "just now";
            if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
            if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
            return `${Math.floor(diff/86400)}d ago`;
        };

        const fetchRoll = async () => {
            spinner.style.display = "block";
            body.innerHTML = "";
            try {
                const res = await fetch(cfg.feed_url);
                if (!res.ok) throw new Error("Network error");
                const txt = await res.text();
                const xml = new DOMParser().parseFromString(txt, "application/xml");
                const items = Array.from(xml.querySelectorAll("item"));
                if (!items.length) throw new Error("No items");

                items.slice(0, 15).forEach(item => {
                    const title = item.querySelector("title")?.textContent || "No Title";
                    const link = item.querySelector("link")?.textContent || "#";
                    const pubDate = new Date(item.querySelector("pubDate")?.textContent || Date.now());
                    const time = getRelativeTime(pubDate);
                    const descText = item.querySelector("description")?.textContent || "";
                    const imgMatch = descText.match(/<img[^>]+src="([^"]+)"/i);
                    const img = imgMatch ? imgMatch[1] : "https://via.placeholder.com/100x64.png?text=No+Image";

                    const a = document.createElement("a");
                    a.href = link;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.className = "newsroll-list-item";
                    a.innerHTML = `
                        <img src="${img}" alt="" loading="lazy">
                        <div class="newsroll-desc">
                            <p>${title}</p>
                            <span class="newsroll-date">${time}</span>
                        </div>`;
                    body.appendChild(a);
                });
                loaded = true;
            } catch (err) {
                body.innerHTML = `<p style='text-align:center;color:#777;'>Could not load articles.</p>`;
            } finally {
                spinner.style.display = "none";
            }
        };

        updateSubUI = () => {
            if (!("Notification" in window) || !("serviceWorker" in navigator)) {
                subscribeBtn.style.display = "none";
                subMsg.style.display = "block";
                subMsg.textContent = "Notifications not supported on this browser.";
                subMsg.className = "subscription-message denied";
                return;
            }
            const permission = Notification.permission;
            if (permission === "granted") {
                subscribeBtn.style.display = "none";
                subMsg.style.display = "block";
                subMsg.textContent = "✅ You are subscribed!";
                subMsg.className = "subscription-message success";
            } else if (permission === "denied") {
                subscribeBtn.style.display = "none";
                subMsg.style.display = "block";
                subMsg.textContent = "Notifications blocked. Please enable them in your browser settings.";
                subMsg.className = "subscription-message denied";
            } else {
                subscribeBtn.style.display = "block";
                subMsg.style.display = "none";
            }
        };

        subscribeBtn.addEventListener("click", () => {
            if (window.myPushRequestAndRegister) {
                subscribeBtn.textContent = "Processing...";
                subscribeBtn.disabled = true;
                window.myPushRequestAndRegister();
            } else {
                console.error("MyPush registration function is not available.");
            }
        });

        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = card.style.display === "flex";
            card.style.display = isOpen ? "none" : "flex";
            if (!loaded && !isOpen) fetchRoll();
            updateSubUI();
        });

        closeBtn.addEventListener("click", () => card.style.display = "none");
        document.addEventListener("click", (e) => {
            if (!card.contains(e.target) && !icon.contains(e.target)) {
                card.style.display = "none";
            }
        });

        updateSubUI();
    };

})();
