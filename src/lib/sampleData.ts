import { MenuItem } from '../types';
import { collection, doc, writeBatch, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const SAMPLE_MENU_ITEMS: Omit<MenuItem, 'id'>[] = [
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

/**
 * Seeds sample menu items to Firestore for a specific date (or both today & tomorrow).
 * Uses batch write which works on Firebase Spark (free) tier without Cloud Functions.
 */
export async function seedSampleMenuToFirestore(dates?: string[]): Promise<number> {
  const d = new Date();
  const today = d.toISOString().split('T')[0];
  const dTomorrow = new Date();
  dTomorrow.setDate(dTomorrow.getDate() + 1);
  const tomorrow = dTomorrow.toISOString().split('T')[0];

  const targetDates = dates && dates.length > 0 ? dates : [today, tomorrow];
  let totalSeeded = 0;

  for (const date of targetDates) {
    const colRef = collection(db, 'menu', date, 'items');
    const existingSnap = await getDocs(colRef);

    // If items already exist, only add if collection is empty
    if (existingSnap.empty) {
      const batch = writeBatch(db);
      for (const item of SAMPLE_MENU_ITEMS) {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, item);
      }
      await batch.commit();
      totalSeeded += SAMPLE_MENU_ITEMS.length;
    }
  }

  return totalSeeded;
}
