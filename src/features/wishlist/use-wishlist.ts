"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  slug: string;
  title: string;
  price: number; // paise
  compareAtPrice: number | null;
  imageUrl: string | null;
};

type WishlistStore = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

/**
 * Persistent wishlist — survives reloads and login/logout on the device
 * (localStorage, like the cart). Product-level (not per-variant).
 */
export const useWishlist = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],
      toggle: (item) =>
        set((state) => ({
          items: state.items.some((entry) => entry.slug === item.slug)
            ? state.items.filter((entry) => entry.slug !== item.slug)
            : [item, ...state.items],
        })),
      remove: (slug) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.slug !== slug),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "dope-wishlist" },
  ),
);

export function wishlistCount(items: WishlistItem[]): number {
  return items.length;
}
