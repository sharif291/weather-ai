import admin from 'firebase-admin';
import { config } from './config.js';

let firebaseApp = null;
let firestoreDb = null;
let isActive = false;

if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
  console.warn('[Firebase Warning] Firebase Admin configuration variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not configured. Realtime features will be inactive.');
} else {
  try {
    console.log(`[Firebase] Initializing Firebase Admin SDK for project: ${config.firebase.projectId}`);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      })
    });
    firestoreDb = admin.firestore();
    isActive = true;
  } catch (err) {
    console.error('[Firebase Error] Initialization failed:', err.message);
  }
}

export const firebaseAdmin = {
  app: firebaseApp,
  auth: () => isActive ? admin.auth() : null,
  firestore: () => isActive ? firestoreDb : null,
  isActive
};

export default firebaseAdmin;
