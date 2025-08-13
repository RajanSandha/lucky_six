// This file is for server-side Firebase logic.
import * as admin from 'firebase-admin';

// Check if the service account key is available in environment variables
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.warn(
    'Firebase Admin SDK not initialized. The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. This is required for sending push notifications.'
  );
}

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Error parsing Firebase service account key or initializing Admin SDK:', error.message);
  }
}

const auth = admin.apps.length ? admin.auth() : null;
const dbAdmin = admin.apps.length ? admin.firestore() : null;
const messaging = admin.apps.length ? admin.messaging() : null;

export { auth, dbAdmin, messaging };
