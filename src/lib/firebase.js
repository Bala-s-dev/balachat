import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Correct import for Firestore
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "webchat-1cee7.firebaseapp.com",
  projectId: "webchat-1cee7",
  storageBucket: "webchat-1cee7.appspot.com",
  messagingSenderId: "21554291273",
  appId: "1:21554291273:web:e5926e20cec0b1595b5598"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(); // Using full Firestore SDK
export const storage = getStorage();
