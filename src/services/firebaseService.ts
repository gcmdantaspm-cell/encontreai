/**
 * Serviço centralizado do Firebase
 * Organiza a inicialização e exporta as instâncias globalmente.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey;

if (!apiKey || apiKey === "AIzaSyDummyKeyForDevEnvironment") {
  throw new Error('VITE_FIREBASE_API_KEY não configurada de forma válida. Verifique o .env ou as variáveis do Vercel.');
}

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseAppletConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();
export default app;
