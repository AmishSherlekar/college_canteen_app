import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MenuItem } from '../types';
import { SAMPLE_MENU_ITEMS, seedSampleMenuToFirestore } from '../lib/sampleData';

const DEFAULT_SAMPLE_ITEMS: MenuItem[] = SAMPLE_MENU_ITEMS.map((item, idx) => ({
  id: `sample-${idx + 1}`,
  ...item,
}));

/**
 * Returns menu items in real-time from Firestore.
 * Pre-populates immediately with sample items so UI never freezes or hangs.
 */
export function useMenu(date: string) {
  // Pre-populate with sample items so menu is immediately visible & clickable
  const [items, setItems] = useState<MenuItem[]>(DEFAULT_SAMPLE_ITEMS);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState<boolean>(true);

  useEffect(() => {
    if (!date) return;

    let unsub: (() => void) | undefined;
    try {
      const colRef = collection(db, 'menu', date, 'items');
      unsub = onSnapshot(
        colRef,
        (snap) => {
          if (!snap.empty) {
            const data: MenuItem[] = snap.docs
              .map((d) => ({ id: d.id, ...(d.data() as Omit<MenuItem, 'id'>) }))
              .filter((item) => item.isAvailable !== false)
              .sort((a, b) => a.category.localeCompare(b.category));
            setItems(data);
            setIsSampleData(false);
          } else {
            setItems(DEFAULT_SAMPLE_ITEMS);
            setIsSampleData(true);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          // If Firestore is not created or unreachable, keep sample items active
          console.warn('Firestore menu sync notice (using sample items):', err.message);
          setItems(DEFAULT_SAMPLE_ITEMS);
          setIsSampleData(true);
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.warn('Firestore onSnapshot init notice:', err?.message);
      setItems(DEFAULT_SAMPLE_ITEMS);
      setIsSampleData(true);
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [date]);

  const seedToFirebase = async () => {
    setLoading(true);
    try {
      await seedSampleMenuToFirestore([date]);
    } catch (e: any) {
      console.error('Seed error:', e);
      setError(e.message || 'Failed to seed');
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, error, isSampleData, seedToFirebase };
}
