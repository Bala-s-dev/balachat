import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Correct import for Firestore
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "balachat-a2150.firebaseapp.com",
  projectId: "balachat-a2150",
  storageBucket: "balachat-a2150.appspot.com",
  messagingSenderId: "103851668119",
  appId: "1:103851668119:web:ee035563f21af8c588afd2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(); // Using full Firestore SDK
export const storage = getStorage();
