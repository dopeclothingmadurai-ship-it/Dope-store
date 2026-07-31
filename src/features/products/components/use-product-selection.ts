"use client";

import { create } from "zustand";

type ProductSelectionStore = {
  ids: Set<string>;
  toggle: (id: string) => void;
  setMany: (ids: string[], selected: boolean) => void;
  clear: () => void;
};

/**
 * Module-level selection store. Because it lives outside the React tree it
 * survives client navigations, so a selection persists while the staff member
 * searches, filters and pages through the catalog.
 */
export const useProductSelection = create<ProductSelectionStore>((set) => ({
  ids: new Set<string>(),
  toggle: (id) =>
    set((state) => {
      const next = new Set(state.ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ids: next };
    }),
  setMany: (ids, selected) =>
    set((state) => {
      const next = new Set(state.ids);
      for (const id of ids) {
        if (selected) next.add(id);
        else next.delete(id);
      }
      return { ids: next };
    }),
  clear: () => set({ ids: new Set<string>() }),
}));
