import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBLrSNBXxhmrQ9WyVq2aMPvAEokna-H4vU",
  authDomain: "campus-map-c82e2.firebaseapp.com",
  projectId: "campus-map-c82e2",
  storageBucket: "campus-map-c82e2.firebasestorage.app",
  messagingSenderId: "603212675594",
  appId: "1:603212675594:web:98a067ac8d5fe785d43df3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 THIS is your database (important)
export const db = getFirestore(app);