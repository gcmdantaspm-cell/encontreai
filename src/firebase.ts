import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCqWzZ-NWsLRajZf_jqcDJEL6FyT-4sCo8",
  authDomain: "encontreai-f20fa.firebaseapp.com",
  projectId: "encontreai-f20fa",
  storageBucket: "encontreai-f20fa.firebasestorage.app",
  messagingSenderId: "1074482447493",
  appId: "1:1074482447493:web:3a2ec40527ea93024995ec",
  measurementId: "G-9MP7TSVL58"
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
