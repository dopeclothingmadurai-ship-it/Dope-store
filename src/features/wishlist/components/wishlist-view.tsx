"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, ImageIcon } from "lucide-react";

import { formatPaise } from "@/lib/money";

import { useWishlist } from "../use-wishlist";
import { WishlistButton } from "./wishlist-button";

export function WishlistView() {
  const items = useWishlist((state) => state.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // localStorage-backed — render nothing until mounted to avoid a mismatch.
  if (!mounted) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  if (items.length === 0) {
    return (
      <div className="border-border flex flex-col items-center border border-dashed px-6 py-24 text-center">
        <Heart className="text-muted-foreground/40 size-8" strokeWidth={1.5} />
        <p className="text-muted-foreground mt-4 text-sm">
          Your wishlist is empty.
        </p>
        <Link
          href="/shop"
          className="text-foreground hover:text-gold mt-4 text-[12px] font-medium tracking-[0.16em] uppercase underline underline-offset-4 transition-colors"
        >
          Explore the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
      {items.map((item) => {
        const onSale =
          item.compareAtPrice != null && item.compareAtPrice > item.price;
        return (
          <div key={item.slug} className="group">
            <Link
              href={`/product/${item.slug}`}
              className="bg-secondary relative block aspect-[3/4] overflow-hidden"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              ) : (
                <div className="text-muted-foreground/40 flex h-full w-full items-center justify-center">
                  <ImageIcon className="size-8" />
                </div>
              )}
              <WishlistButton
                product={item}
                className="bg-background/70 hover:bg-background absolute top-3 right-3 size-9 rounded-full backdrop-blur-sm"
              />
            </Link>
            <div className="mt-4 flex items-start justify-between gap-3">
              <Link
                href={`/product/${item.slug}`}
                className="text-foreground/90 hover:text-foreground text-sm leading-snug tracking-wide transition-colors"
              >
                {item.title}
              </Link>
              <div className="shrink-0 text-right text-sm tabular-nums">
                <span className={onSale ? "text-gold" : "text-foreground/80"}>
                  {formatPaise(item.price)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
