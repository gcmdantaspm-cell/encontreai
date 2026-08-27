/**
 * Serviço centralizado do Firebase
 * Organiza a inicialização e exporta as instâncias globalmente.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevEnvironment",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "encontreai-f20fa.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "encontreai-f20fa",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "encontreai-f20fa.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "888888888",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:888888:web:abcdefg"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
