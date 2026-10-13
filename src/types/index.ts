// ─── User ────────────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  rollNo: string;
  role: UserRole;
  email: string;
}

// ─── Menu ────────────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;       // URL or empty string
  maxQty: number;
  orderedCount: number;
  category: string;
  isAvailable: boolean;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus = 'confirmed' | 'served' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  uid: string;
  pickupDate: string;   // 'YYYY-MM-DD'
  slot: string;         // e.g. '12:00 PM – 1:00 PM'
  counter: string;      // e.g. 'Counter A'
  items: OrderItem[];
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  qrToken: string;
  createdAt: number;    // unix ms
}

// ─── QR Token Payload ────────────────────────────────────────────────────────
export interface QRTokenPayload {
  orderId: string;
  uid: string;
  pickupDate: string;
  signature: string;
}
