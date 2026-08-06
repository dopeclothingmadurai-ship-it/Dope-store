import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";

import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { type StoreProductCard } from "../types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: StoreProductCard;
  priority?: boolean;
}) {
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-1"
    >
      <div className="bg-secondary relative aspect-[3/4] overflow-hidden transition-shadow duration-500 group-hover:shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)]">
        {product.imageUrl ? (
          <>
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              className={cn(
                "object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:scale-[1.06]",
                product.hoverImageUrl &&
                  "opacity-100 transition-[transform,opacity] group-hover:opacity-0",
              )}
            />
            {product.hoverImageUrl ? (
              <Image
                src={product.hoverImageUrl}
                alt=""
                aria-hidden
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="scale-[1.06] object-cover opacity-0 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
              />
            ) : null}

            {/* Depth wash + reveal CTA on hover */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex translate-y-3 items-center justify-between opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
              <span className="text-[11px] font-medium tracking-[0.22em] text-white uppercase">
                View
              </span>
              <ArrowUpRight className="size-4 text-white" strokeWidth={1.5} />
            </div>
          </>
        ) : (
          <div className="text-muted-foreground/40 flex h-full w-full items-center justify-center">
            <ImageIcon className="size-8" />
          </div>
        )}

        {onSale ? (
          <span className="text-gold absolute top-3 left-3 text-[10px] font-medium tracking-[0.2em] uppercase">
            Sale
          </span>
        ) : null}

        <WishlistButton
          product={{
            slug: product.slug,
            title: product.title,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            imageUrl: product.imageUrl,
          }}
          className="bg-background/70 hover:bg-background absolute top-3 right-3 size-9 rounded-full opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100"
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h3 className="text-foreground/90 group-hover:text-foreground text-sm leading-snug font-normal tracking-wide transition-colors">
          {product.title}
        </h3>
        <div className="shrink-0 text-right text-sm tabular-nums">
          <span className={onSale ? "text-gold" : "text-foreground/80"}>
            {formatPaise(product.price)}
          </span>
          {onSale ? (
            <span className="text-muted-foreground ml-2 line-through">
              {formatPaise(product.compareAtPrice!)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
