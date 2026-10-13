/**
 * Seed sample canteen menu items into Firestore using Firebase Client SDK.
 * Compatible with Firebase Spark (Free) tier — No serviceAccount.json or paid features needed.
 *
 * Run: node scripts/seedMenu.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, writeBatch } = require('firebase/firestore');

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
const db = getFirestore(app);

function getDates() {
  const dToday = new Date();
  const today = dToday.toISOString().split('T')[0];
  const dTomorrow = new Date();
  dTomorrow.setDate(dTomorrow.getDate() + 1);
  const tomorrow = dTomorrow.toISOString().split('T')[0];
  return [today, tomorrow];
}

const sampleMenuItems = [
  {
    name: 'Paneer Butter Masala + 2 Rotis',
    price: 60,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80',
    maxQty: 50,
    orderedCount: 0,
    category: 'Main Course',
    isAvailable: true,
  },
  {
    name: 'Veg Fried Rice Combo',
    price: 55,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80',
    maxQty: 40,
    orderedCount: 0,
    category: 'Main Course',
    isAvailable: true,
  },
  {
    name: 'Dal Tadka + Jeera Rice',
    price: 45,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80',
    maxQty: 60,
    orderedCount: 0,
    category: 'Main Course',
    isAvailable: true,
  },
  {
    name: 'Crispy Masala Dosa',
    price: 40,
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&q=80',
    maxQty: 45,
    orderedCount: 0,
    category: 'South Indian',
    isAvailable: true,
  },
  {
    name: 'Hot Samosa (2 pcs) + Chutney',
    price: 20,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
    maxQty: 80,
    orderedCount: 0,
    category: 'Snacks',
    isAvailable: true,
  },
  {
    name: 'Veg Hakka Noodles',
    price: 50,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&q=80',
    maxQty: 35,
    orderedCount: 0,
    category: 'Snacks',
    isAvailable: true,
  },
  {
    name: 'Special Masala Chai',
    price: 12,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    maxQty: 100,
    orderedCount: 0,
    category: 'Beverages',
    isAvailable: true,
  },
  {
    name: 'Thick Cold Coffee',
    price: 30,
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    maxQty: 30,
    orderedCount: 0,
    category: 'Beverages',
    isAvailable: true,
  },
  {
    name: 'Hot Gulab Jamun (2 pcs)',
    price: 25,
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&q=80',
    maxQty: 50,
    orderedCount: 0,
    category: 'Desserts',
    isAvailable: true,
  },
];

async function seed() {
  const dates = getDates();
  for (const date of dates) {
    const batch = writeBatch(db);
    const colRef = collection(db, 'menu', date, 'items');

    for (const item of sampleMenuItems) {
      const docRef = doc(colRef);
      batch.set(docRef, item);
    }

    await batch.commit();
    console.log(`✅ Seeded ${sampleMenuItems.length} sample items for ${date}`);
  }
  console.log('🎉 Done seeding menu items!');
  process.exit(0);
}

seed().catch((e) => {
  console.error('❌ Error seeding items:', e.message);
  process.exit(1);
});
