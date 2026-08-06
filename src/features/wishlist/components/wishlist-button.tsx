"use client";

import { type MouseEvent, useEffect, useState } from "react";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

import { type WishlistItem, useWishlist } from "../use-wishlist";

/**
 * Heart toggle. Safe to render inside a product-card <Link> — it stops the
 * click from navigating. Guards against hydration mismatch with a mounted flag.
 */
export function WishlistButton({
  product,
  className,
}: {
  product: WishlistItem;
  className?: string;
}) {
  const items = useWishlist((state) => state.items);
  const toggle = useWishlist((state) => state.toggle);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const active = mounted && items.some((entry) => entry.slug === product.slug);

  function onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle(product);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      className={cn(
        "flex items-center justify-center transition-colors",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-all duration-300",
          active
            ? "fill-gold text-gold scale-110"
            : "text-foreground/70 hover:text-foreground",
        )}
        strokeWidth={1.5}
      />
    </button>
  );
}
