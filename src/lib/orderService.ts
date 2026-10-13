import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { Order, OrderItem } from '../types';

const STORAGE_KEY = '@canteen_orders_cache';

// Helper to avoid hanging when Firestore is not created or offline
function withTimeout<T>(promise: Promise<T>, ms = 1200): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), ms)
    ),
  ]);
}

async function getLocalOrders(): Promise<Order[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalOrder(order: Order): Promise<void> {
  try {
    const list = await getLocalOrders();
    const filtered = list.filter((o) => o.id !== order.id);
    filtered.unshift(order);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Failed to cache order locally:', e);
  }
}

export interface CreateOrderParams {
  uid: string;
  pickupDate: string;
  slot?: string;
  counter?: string;
  items: OrderItem[];
  total: number;
}

/**
 * Creates an order instantly in local storage & attempts background Firestore sync.
 * Generates an embedded scannable JSON qrToken.
 */
export async function createOrderClient(params: CreateOrderParams): Promise<Order> {
  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const now = Date.now();
  const slot = params.slot || '12:30 PM – 1:00 PM';
  const counter = params.counter || 'Counter A (Fast Track)';

  // Build a portable QR token payload that scanner can decode even offline
  const qrPayload = {
    orderId,
    uid: params.uid,
    pickupDate: params.pickupDate,
    slot,
    counter,
    total: params.total,
    itemsSummary: params.items.map((i) => `${i.name} x${i.quantity}`).join(', '),
    createdAt: now,
  };

  const newOrder: Order = {
    id: orderId,
    uid: params.uid,
    pickupDate: params.pickupDate,
    slot,
    counter,
    items: params.items,
    total: params.total,
    paymentStatus: 'paid',
    status: 'confirmed',
    qrToken: JSON.stringify(qrPayload),
    createdAt: now,
  };

  // 1. Instant save to local storage cache so it NEVER hangs
  await saveLocalOrder(newOrder);

  // 2. Background attempt to write to Firestore (with 1.5s timeout)
  withTimeout(setDoc(doc(db, 'orders', orderId), newOrder), 1500).catch((err) => {
    console.warn('Firestore sync note (order is safe in local storage):', err.message);
  });

  return newOrder;
}

/**
 * Fetch orders for a user. Returns local cache immediately, merges Firestore in background.
 */
export async function getUserOrders(uid: string): Promise<Order[]> {
  const localList = await getLocalOrders();
  const userLocal = localList.filter((o) => o.uid === uid || uid === 'guest-user');

  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('uid', '==', uid));
    const snap = await withTimeout(getDocs(q), 1200);

    if (!snap.empty) {
      const fsOrders: Order[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Order, 'id'>),
      }));

      const map = new Map<string, Order>();
      userLocal.forEach((o) => map.set(o.id, o));
      fsOrders.forEach((o) => map.set(o.id, o));
      return Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  } catch (err) {
    // If Firestore times out or is not created, return local orders immediately
  }

  return userLocal.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

/**
 * Fetch a single order by ID.
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  // Check local storage first (instant return)
  const localList = await getLocalOrders();
  const foundLocal = localList.find((o) => o.id === orderId);
  if (foundLocal) {
    return foundLocal;
  }

  // Try Firestore with timeout
  try {
    const docRef = doc(db, 'orders', orderId);
    const snap = await withTimeout(getDoc(docRef), 1200);
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
    }
  } catch (err) {
    // Timeout or offline
  }

  return null;
}

/**
 * Verifies and marks an order as served (redeemed).
 */
export async function verifyAndServeClient(
  orderId: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  let existingOrder = await getOrderById(orderId);

  if (!existingOrder) {
    return { success: false, error: 'Order not found in database.' };
  }

  if (existingOrder.status === 'served') {
    return {
      success: false,
      order: existingOrder,
      error: 'Order has ALREADY been served / redeemed!',
    };
  }

  if (existingOrder.status === 'cancelled') {
    return {
      success: false,
      order: existingOrder,
      error: 'Order was cancelled!',
    };
  }

  const updatedOrder: Order = {
    ...existingOrder,
    status: 'served',
  };

  // 1. Instant update in local cache
  await saveLocalOrder(updatedOrder);

  // 2. Background update Firestore with timeout
  withTimeout(
    updateDoc(doc(db, 'orders', orderId), {
      status: 'served',
      servedAt: Date.now(),
    }),
    1500
  ).catch((err) => {
    console.warn('Firestore update note (order served locally):', err.message);
  });

  return { success: true, order: updatedOrder };
}
