import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAz8T1puNtuMdtt6g8PUopJg8X6Tqw8qog",
  authDomain: "school-canteen-app-d0589.firebaseapp.com",
  projectId: "school-canteen-app-d0589",
  storageBucket: "school-canteen-app-d0589.firebasestorage.app",
  messagingSenderId: "1031006897516",
  appId: "1:1031006897516:web:c1368df4d6cf4785559f49",
  measurementId: "G-LEBH7TZCHJ"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default {app,db,auth};