import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  // projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // appId: import.meta.env.VITE_FIREBASE_APP_ID,
  apiKey: "AIzaSyBZfAB3BGJLYUYaNmhDYYWfUoskO4U8N0k",
  authDomain: "dream-jeweles.firebaseapp.com",
  databaseURL: "https://dream-jeweles-default-rtdb.firebaseio.com",
  projectId: "dream-jeweles",
  storageBucket: "dream-jeweles.firebasestorage.app",
  messagingSenderId: "153082202942",
  appId: "1:153082202942:web:949dd3db3469330c54fa6f",
  measurementId: "G-CZH1C2FQV2"
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.databaseURL &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const firebaseDatabase = isFirebaseConfigured
  ? getDatabase(getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig))
  : null;
