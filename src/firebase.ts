import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqWzZ-NWsLRajZf_jqcDJEL6FyT-4sCo8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "encontreai-f20fa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "encontreai-f20fa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "encontreai-f20fa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1074482447493",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1074482447493:web:3a2ec40527ea93024995ec",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9MP7TSVL58"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize analytics conditionally to prevent errors in non-browser environments
let analytics = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
}).catch(() => {});
export { analytics };
