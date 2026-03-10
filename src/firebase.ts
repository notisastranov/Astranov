import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForPreview",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "ais-europe-west1-d519425142f94"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ais-europe-west1-d519425142f94",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "ais-europe-west1-d519425142f94"}.appspot.com`,
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
