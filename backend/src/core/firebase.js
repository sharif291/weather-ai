import admin from 'firebase-admin';
import { config } from './config.js';

if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
  throw new Error('[Firebase Config Error] Firebase Admin configuration variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are required but not configured.');
}

console.log(`[Firebase] Initializing Firebase Admin SDK for project: ${config.firebase.projectId}`);

const firebaseApp = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey,
  })
});

const firestoreDb = admin.firestore();

export const firebaseAdmin = {
  app: firebaseApp,
  auth: () => admin.auth(),
  firestore: () => firestoreDb,
  isActive: true
};

export default firebaseAdmin;
