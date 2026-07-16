import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  writeBatch 
} from 'firebase/firestore';

// Vite environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('[Firebase SDK] Initializing Firebase Client services.');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const firebaseService = {
  isMock: false,
  auth: {
    currentUser: auth.currentUser,
    isMock: false,
    onAuthStateChanged: (cb) => onAuthStateChanged(auth, (user) => {
      firebaseService.auth.currentUser = user;
      cb(user);
    }),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    signInWithGoogle: () => {
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
    },
    logout: () => signOut(auth)
  },
  db: {
    isMock: false,
    onSnapshotNotifications: (userId, onNext) => {
      const q = collection(db, 'users', userId, 'notifications');
      return onSnapshot(q, onNext);
    },
    onSnapshotGlobalBroadcasts: (onNext) => {
      const q = collection(db, 'global_broadcasts');
      return onSnapshot(q, onNext);
    },
    markNotificationAsRead: async (userId, notificationId) => {
      const docRef = doc(db, 'users', userId, 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
    },
    markAllNotificationsAsRead: async (userId) => {
      const q = query(
        collection(db, 'users', userId, 'notifications'),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        batch.update(d.ref, { read: true });
      });
      await batch.commit();
    }
  }
};

export default firebaseService;
