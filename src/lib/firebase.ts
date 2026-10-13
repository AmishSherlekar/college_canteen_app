import { initializeApp, getApps } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
  apiKey: "AIzaSyAz8T1puNtuMdtt6g8PUopJg8X6Tqw8qog",
  authDomain: "school-canteen-app-d0589.firebaseapp.com",
  projectId: "school-canteen-app-d0589",
  messagingSenderId: "1031006897516",
  appId: "1:1031006897516:web:c1368df4d6cf4785559f49",
};


// Prevent duplicate initialisation on hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Auth with AsyncStorage persistence (needed for React Native)
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized (hot-reload)
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
