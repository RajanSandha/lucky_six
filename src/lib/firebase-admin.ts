// This file is for server-side Firebase logic.
// It's not used in this implementation yet, but is good practice to have.
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // For local development without service account
    console.warn("Firebase Admin SDK not initialized. Service account key not found.")
  }
}

const auth = admin.apps.length ? admin.auth() : null;
const db = admin.apps.length ? admin.firestore() : null;

export { auth, db };
