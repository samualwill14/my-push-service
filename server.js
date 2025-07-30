// ===================================================================================
//  MyPush Service - Final Production Server
// ===================================================================================

// --- DEPENDENCIES ---
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

// --- FIREBASE ADMIN SDK INITIALIZATION ---
// This block handles credentials for both production (Render) and local development.
try {
    let serviceAccount;

    // Check if the environment variable is set (this is for Render)
    if (process.env.FIREBASE_CREDENTIALS) {
        console.log("Found FIREBASE_CREDENTIALS environment variable. Parsing...");
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        // Fallback for local testing: look for the local key file
        console.log("FIREBASE_CREDENTIALS env var not found. Looking for local key file...");
        // MAKE SURE THIS FILENAME MATCHES THE KEY YOU USE FOR LOCAL TESTING
        serviceAccount = require('./mypushapp-7bb12-firebase-adminsdk-fbsvc-0420460db5.json');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");

} catch (error) {
    console.error("\n\nFATAL ERROR: Could not initialize Firebase Admin SDK.");
    console.error("Error Details:", error.message);
    process.exit(1);
}

// --- INITIALIZE FIRESTORE ---
const db = admin.firestore();
console.log("Using Firestore for persistent subscriber storage.");

// --- INITIALIZE EXPRESS APP ---
const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, ''))); // Serve static files (push-init.js, admin.html)

// --- API ENDPOINTS ---

// [ENDPOINT 1] Provides UI configuration to the client script.
app.post('/api/get-config', (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
    }
    console.log(`[CONFIG] Configuration requested for domain: ${domain}`);

    const config = {
        roll_services: {
            title: "Latest News & Updates",
            theme: "#007bff",
            icon: "fa-bell",
            feed_url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
            postion: "bottom-right",
        },
        flask_services: null
    };
    res.json(config);
});

// [ENDPOINT 2] Saves a new subscriber token to Firestore.
app.post('/api/subscribe', async (req, res) => {
    const { token, domain } = req.body;
    if (!token || !domain) {
        return res.status(400).json({ error: 'Token and domain are required' });
    }

    try {
        console.log(`[SUBSCRIBE] Received token for ${domain}`);
        const docRef = db.collection('subscribers').doc(token);
        await docRef.set({
            token: token,
            domain: domain,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`[SUBSCRIBE] Token for ${domain} saved to Firestore.`);
        res.status(200).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('[SUBSCRIBE] Error saving token to Firestore:', error);
        res.status(500).json({ error: 'Failed to save subscription.' });
    }
});

// [ENDPOINT 3] Sends a push notification and cleans up bad tokens.
app.post('/api/send-push', async (req, res) => {
    const { title, body, icon, url, domain } = req.body;
    if (!title || !body || !url || !domain) {
        return res.status(400).send('Missing required fields');
    }
    console.log(`[SEND] Received request to send push for domain: ${domain}`);

    try {
        // 1. Fetch tokens from Firestore
        const registrationTokens = [];
        const querySnapshot = await db.collection('subscribers').where('domain', '==', domain).get();
        if (querySnapshot.empty) {
            console.log(`[SEND] No subscribers found in Firestore for domain: ${domain}`);
            return res.status(404).send(`No subscribers found for domain: ${domain}`);
        }
        querySnapshot.forEach(doc => {
            registrationTokens.push(doc.data().token);
        });
        console.log(`[SEND] Found ${registrationTokens.length} tokens for domain: ${domain}.`);

        // 2. Build the message payload
        const message = {
            notification: { title: title, body: body },
            webpush: {
                notification: { icon: icon || 'https://www.google.com/favicon.ico' },
                fcm_options: { link: url }
            },
            tokens: registrationTokens,
        };

        // 3. Send the message
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[SEND] ${response.successCount} of ${registrationTokens.length} messages were sent successfully.`);

        // 4. Clean up invalid tokens
        if (response.failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
                        const badToken = registrationTokens[idx];
                        tokensToDelete.push(badToken);
                    }
                }
            });

            if (tokensToDelete.length > 0) {
                console.log(`[CLEANUP] Deleting ${tokensToDelete.length} invalid tokens...`);
                const deletePromises = tokensToDelete.map(token => db.collection('subscribers').doc(token).delete());
                await Promise.all(deletePromises);
                console.log(`[CLEANUP] Invalid tokens deleted from Firestore.`);
            }
        }
        res.status(200).json({ message: 'Push notifications sent!', response });

    } catch (error) {
        console.error('[SEND] A critical error occurred:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Push server started and is listening on port ${PORT}`);
});
