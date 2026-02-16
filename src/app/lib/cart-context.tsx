'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ShippingCategory } from '@/app/lib/definitions';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imagePath: string;
  shippingCategory?: ShippingCategory;
  comboId?: string;
  originalProductId?: string;
  color?: string;
  size?: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, color?: string, size?: string) => void;
  updateQuantity: (id: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart) as CartItem[];
        const hydratedItems = parsed.map((item) => ({
          ...item,
          shippingCategory:
            item.shippingCategory === 'clothes' || item.shippingCategory === 'jewelry'
              ? item.shippingCategory
              : undefined,
        }));
        setItems(hydratedItems);
      } catch {
        setItems([]);
      }
    }
  }, []);

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => 
        item.id === newItem.id && 
        item.color === newItem.color && 
        item.size === newItem.size
      );
      if (existingItem) {
        return prevItems.map((item) =>
          (item.id === newItem.id && item.color === newItem.color && item.size === newItem.size)
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prevItems, newItem];
    });
  };

  const removeItem = (id: string, color?: string, size?: string) => {
    setItems((prevItems) => prevItems.filter((item) => 
      !(item.id === id && item.color === color && item.size === size)
    ));
  };

  const updateQuantity = (id: string, quantity: number, color?: string, size?: string) => {
    if (quantity <= 0) {
        removeItem(id, color, size);
        return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id && item.color === color && item.size === size ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}


