const path = require('path');
const fs = require('fs');

// Check for real service account credentials
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../../serviceAccountKey.json');

const hasCredentials = fs.existsSync(serviceAccountPath) || !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let adminExport;
let dbExport;
let authExport;
let storageExport;
let FieldValueExport;

if (hasCredentials) {
  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore, FieldValue } = require('firebase-admin/firestore');
    const { getAuth } = require('firebase-admin/auth');
    const { getStorage } = require('firebase-admin/storage');

    let app;
    if (!getApps().length) {
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        app = initializeApp({
          credential: cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
        });
        console.log('🔥 Firebase Admin initialized with service account key.');
      } else {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
        app = initializeApp({
          credential: cert(serviceAccount),
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`
        });
        console.log('🔥 Firebase Admin initialized with environment JSON.');
      }
    } else {
      app = getApps()[0];
    }

    dbExport = getFirestore();
    dbExport.settings({ ignoreUndefinedProperties: true });
    authExport = getAuth();
    storageExport = getStorage();
    FieldValueExport = FieldValue;

    adminExport = {
      firestore: { FieldValue },
      auth: () => authExport,
      storage: () => storageExport
    };
  } catch (err) {
    console.warn('⚠️ Firebase Admin cloud init failed, falling back to local engine:', err.message);
    const { localDb, localAuth, localFieldValues } = require('./localFirestoreAdapter');
    dbExport = localDb;
    authExport = localAuth;
    FieldValueExport = localFieldValues;
    adminExport = {
      firestore: { FieldValue: localFieldValues },
      auth: () => localAuth,
      storage: () => ({ bucket: () => ({}) })
    };
    storageExport = { bucket: () => ({}) };
  }
} else {
  // Offline / local development mode (no GCP credentials required)
  console.log('⚡ Firebase running with resilient Local Firestore Engine (Persistence & Demo Data enabled).');
  console.log('ℹ️ To connect to live Google Cloud, place serviceAccountKey.json in the project root.');
  const { localDb, localAuth, localFieldValues } = require('./localFirestoreAdapter');
  dbExport = localDb;
  authExport = localAuth;
  FieldValueExport = localFieldValues;
  adminExport = {
    firestore: { FieldValue: localFieldValues },
    auth: () => localAuth,
    storage: () => ({ bucket: () => ({}) })
  };
  storageExport = { bucket: () => ({}) };
}

module.exports = {
  admin: adminExport,
  db: dbExport,
  auth: authExport,
  storage: storageExport,
  FieldValue: FieldValueExport
};
