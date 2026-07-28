"use client";

import { useEffect } from "react";

/**
 * Forces the whole document into the dark admin theme while an admin route is
 * mounted, so portaled UI (dialogs, dropdowns, toasts) inherits it too. The
 * admin content is already `.dark` on the server; this only covers portals.
 */
export function AdminThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    const had = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!had) root.classList.remove("dark");
    };
  }, []);

  return null;
}
