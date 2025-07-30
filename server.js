// server.js (Version with Persistent Firestore Database)

// --- DEPENDENCIES ---
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

// --- CONFIGURATION ---
try {
    // This should be the name of your downloaded service account key file
    const serviceAccount = require('./mypushapp-7bb12-firebase-adminsdk-fbsvc-0420460db5.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error("\n\nFATAL ERROR: Could not find or initialize Firebase Admin SDK. \nDid you download your service account key file and update the filename in server.js?\n\n");
    process.exit(1);
}

// --- INITIALIZE FIRESTORE ---
const db = admin.firestore(); // Get a reference to the database

// --- INITIALIZE EXPRESS APP ---
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

// --- NOTE: The 'subscribers = new Map()' has been REMOVED. We now use Firestore. ---
console.log("Using Firestore for persistent subscriber storage.");

// --- API ENDPOINTS ---

// [ENDPOINT 1] Provides the UI configuration to the client script.
// This endpoint remains unchanged.
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

// [ENDPOINT 2] Saves a new subscriber token to FIRESTORE.
// This is the updated version.
app.post('/api/subscribe', async (req, res) => {
    const { token, domain } = req.body;
    if (!token || !domain) {
        return res.status(400).json({ error: 'Token and domain are required' });
    }

    try {
        console.log(`[SUBSCRIBE] Received token for ${domain}: ${token.substring(0, 20)}...`);
        // We use the token itself as the document ID to prevent duplicates.
        const docRef = db.collection('subscribers').doc(token);

        // Set the data for the new subscriber document
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

// [ENDPOINT 3] Sends a push notification by fetching tokens from FIRESTORE.
// This is the updated version.
app.post('/api/send-push', async (req, res) => {
    const { title, body, icon, url, domain } = req.body;

    if (!title || !body || !url || !domain) {
        return res.status(400).send('Missing required fields: title, body, url, or domain');
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

        console.log(`[SEND] Found ${registrationTokens.length} tokens in Firestore for domain: ${domain}.`);

        // 2. Build the message payload (this structure is correct)
        const message = {
            notification: {
                title: title,
                body: body,
            },
            webpush: {
                notification: {
                    icon: icon || 'https://www.google.com/favicon.ico'
                },
                fcm_options: {
                    link: url
                }
            },
            tokens: registrationTokens,
        };

        // 3. Send the message using the correct function name
        // AFTER
const response = await admin.messaging().sendEachForMulticast(message);

console.log(`[SEND] ${response.successCount} of ${registrationTokens.length} messages were sent successfully.`);

// --- NEW: Cleanup Logic ---
if (response.failureCount > 0) {
    const tokensToDelete = [];
    response.responses.forEach((resp, idx) => {
        if (!resp.success) {
            const errorCode = resp.error.code;
            // Check for the specific error codes that mean a token is invalid
            if (errorCode === 'messaging/registration-token-not-registered' ||
                errorCode === 'messaging/invalid-registration-token') {
                
                const badToken = registrationTokens[idx];
                tokensToDelete.push(badToken);
                console.log(`[CLEANUP] Flagging invalid token for deletion: ${badToken.substring(0, 20)}...`);
            }
        }
    });

    // Delete the invalid tokens from Firestore
    if (tokensToDelete.length > 0) {
        const deletePromises = tokensToDelete.map(token => db.collection('subscribers').doc(token).delete());
        await Promise.all(deletePromises);
        console.log(`[CLEANUP] Deleted ${tokensToDelete.length} invalid tokens from Firestore.`);
    }
}
// --- END: Cleanup Logic ---

res.status(200).json({ message: 'Push notifications sent!', response });

    } catch (error) {
        console.error('[SEND] A critical error occurred:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});


// --- START THE SERVER ---
const PORT = process.env.PORT || 3000; // Render will set this PORT variable
app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
    console.log(`\n✅ Push server started and is listening on port ${PORT}`);
});
