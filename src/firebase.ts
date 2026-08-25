import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqWzZ-NWsLRajZf_jqcDJEL6FyT-4sCo8",
  authDomain: "encontreai-f20fa.firebaseapp.com",
  projectId: "encontreai-f20fa",
  storageBucket: "encontreai-f20fa.firebasestorage.app",
  messagingSenderId: "1074482447493",
  appId: "1:1074482447493:web:3a2ec40527ea93024995ec"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
