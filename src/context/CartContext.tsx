import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MenuItem, CartItem } from '../types';

interface CartContextValue {
  cart: Record<string, number>;
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itemsMap, setItemsMap] = useState<Record<string, { item: MenuItem; quantity: number }>>({});

  const addToCart = (item: MenuItem) => {
    setItemsMap((prev) => {
      const existing = prev[item.id];
      const newQty = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [item.id]: { item, quantity: newQty },
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setItemsMap((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const clearCart = () => {
    setItemsMap({});
  };

  const cart: Record<string, number> = {};
  const cartItems: CartItem[] = [];
  let cartTotal = 0;
  let cartCount = 0;

  Object.values(itemsMap).forEach(({ item, quantity }) => {
    if (quantity > 0) {
      cart[item.id] = quantity;
      cartItems.push({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        image: item.image,
      });
      cartTotal += item.price * quantity;
      cartCount += quantity;
    }
  });

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
