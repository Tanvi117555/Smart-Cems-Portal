import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeySmartCEMS2026ValidMock",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smart-cems-portal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smart-cems-portal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smart-cems-portal.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102938475612",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:102938475612:web:a1b2c3d4e5f6g7h8"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Connect to Emulators in local emulator development if enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('⚡ Connected to Firebase Local Emulators');
  } catch (err) {
    console.warn('Emulators already connected or failed:', err.message);
  }
}

export default app;
