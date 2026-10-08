const path = require('path');
const fs = require('fs');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, '../../serviceAccountKey.json');

// Resolve credentials from environment or file
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  } catch (e) {
    console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e.message);
  }
}

if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.warn('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
  }
}

if (!serviceAccount && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID || 'smart-cems-portal',
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  };
}

if (!serviceAccount && fs.existsSync(serviceAccountPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (e) {
    console.warn('⚠️ Failed to parse serviceAccountKey.json:', e.message);
  }
}

const hasCredentials = !!serviceAccount;

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
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET ||
        (serviceAccount.project_id ? `${serviceAccount.project_id}.firebasestorage.app` : undefined);

      app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName
      });
      console.log('🔥 Firebase Admin initialized with cloud credentials.');
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
