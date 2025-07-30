const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');

try {
    let serviceAccount;
    if (process.env.FIREBASE_CREDENTIALS) {
        console.log("Found FIREBASE_CREDENTIALS environment variable. Parsing...");
        serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } else {
        console.log("FIREBASE_CREDENTIALS env var not found. Looking for local key file...");
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

const db = admin.firestore();
console.log("Using Firestore for persistent subscriber storage.");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '')));

app.post('/api/get-config', (req, res) => {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });
    console.log(`[CONFIG] Configuration requested for domain: ${domain}`);
    const config = {
        roll_services: {
            title: "Latest News & Updates",
            theme: "#007bff",
            icon: "fa-bell",
            feed_url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
            position: "bottom-right",
        },
    };
    res.json(config);
});

app.get('/api/domains', async (req, res) => {
    try {
        const subscribersSnapshot = await db.collection('subscribers').get();
        const domains = new Set();
        subscribersSnapshot.forEach(doc => {
            if (doc.data().domain) domains.add(doc.data().domain);
        });
        const domainList = Array.from(domains).sort();
        console.log(`[DOMAINS] Found unique domains:`, domainList);
        res.status(200).json({ domains: domainList });
    } catch (error) {
        console.error('[DOMAINS] Error fetching unique domains:', error);
        res.status(500).json({ error: 'Failed to fetch domains.' });
    }
});

app.post('/api/subscribe', async (req, res) => {
    const { token, domain } = req.body;
    if (!token || !domain) return res.status(400).json({ error: 'Token and domain are required' });
    try {
        const docRef = db.collection('subscribers').doc(token);
        await docRef.set({ token, domain, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        console.log(`[SUBSCRIBE] Token for ${domain} saved to Firestore.`);
        res.status(200).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error('[SUBSCRIBE] Error saving token to Firestore:', error);
        res.status(500).json({ error: 'Failed to save subscription.' });
    }
});

app.post('/api/send-push', async (req, res) => {
    const { title, body, icon, url, domain } = req.body;
    if (!title || !body || !url || !domain) return res.status(400).send('Missing required fields');
    console.log(`[SEND] Received request for domain: ${domain}`);

    try {
        const registrationTokens = [];
        const querySnapshot = await db.collection('subscribers').where('domain', '==', domain).get();
        if (querySnapshot.empty) {
            return res.status(404).send(`No subscribers found for domain: ${domain}`);
        }
        querySnapshot.forEach(doc => registrationTokens.push(doc.data().token));
        
        const message = {
            notification: {
                title,
                body,
                icon: icon || 'https://www.google.com/favicon.ico',
            },
            webpush: {
                notification: {
                    icon: icon || 'https://www.google.com/favicon.ico',
                    click_action: url,
                    data: { url }
                }
            },
            tokens: registrationTokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`[SEND] ${response.successCount} of ${registrationTokens.length} messages sent successfully.`);
        
        if (response.failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error.code;
                    if (errorCode === 'messaging/registration-token-not-registered' || errorCode === 'messaging/invalid-registration-token') {
                        tokensToDelete.push(registrationTokens[idx]);
                    }
                }
            });
            if (tokensToDelete.length > 0) {
                const deletePromises = tokensToDelete.map(token => db.collection('subscribers').doc(token).delete());
                await Promise.all(deletePromises);
                console.log(`[CLEANUP] Deleted ${tokensToDelete.length} invalid tokens.`);
            }
        }
        res.status(200).json({ message: 'Push notifications sent!', response });
    } catch (error) {
        console.error('[SEND] A critical error occurred:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Push server started and is listening on port ${PORT}`);
});
