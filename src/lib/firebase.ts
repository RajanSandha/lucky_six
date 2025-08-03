
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "lucky-six-bxkzw",
  appId: "1:902776449872:web:76f0896539572d2cf8da55",
  storageBucket: "lucky-six-bxkzw.firebasestorage.app",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDbpkZD0d47C6Fut4UKP2aHuFGA5cxN5Vo",
  authDomain: "lucky-six-bxkzw.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "902776449872"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
