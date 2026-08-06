import { type Metadata } from "next";

import { Reveal } from "@/features/storefront/components/reveal";
import { WishlistView } from "@/features/wishlist/components/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          Saved for later
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Wishlist
        </h1>
      </Reveal>

      <WishlistView />
    </div>
  );
}
