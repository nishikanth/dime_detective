import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNASMgPhomJjFOtcnuRsZPdtXhanNW7jI",
  authDomain: "dime-detective.firebaseapp.com", 
  projectId: "dime-detective",
  storageBucket: "dime-detective.firebasestorage.app",
  messagingSenderId: "821408194707",
  appId: "1:821408194707:web:e5aa9ab16bd497770b6d66"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
