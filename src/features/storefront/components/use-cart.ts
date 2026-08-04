"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  variantId: string;
  productSlug: string;
  title: string;
  size: string | null;
  price: number; // paise
  imageUrl: string | null;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  open: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
};

export const useCart = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      open: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.variantId === item.variantId,
          );
          const items = existing
            ? state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i,
              )
            : [...state.items, { ...item, quantity }];
          return { items, open: true };
        }),
      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items: state.items.flatMap((i) =>
            i.variantId === variantId
              ? quantity <= 0
                ? []
                : [{ ...i, quantity }]
              : [i],
          ),
        })),
      remove: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "dope-cart",
      // Only the bag contents persist — never the open/closed UI state.
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Total item count (sum of quantities). */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Subtotal in paise. */
export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
