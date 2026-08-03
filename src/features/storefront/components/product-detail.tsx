"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Check, ImageIcon } from "lucide-react";

import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { useCart } from "./use-cart";
import { type StoreProductDetail } from "../types";

export function ProductDetail({ product }: { product: StoreProductDetail }) {
  const add = useCart((state) => state.add);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 0 ? "" : null,
  );
  const [added, setAdded] = useState(false);

  const hasSizes = product.sizes.length > 0;
  const selectedVariant = hasSizes
    ? product.variants.find((variant) => variant.size === size)
    : product.variants[0];

  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const canAdd = Boolean(selectedVariant);

  function addToBag() {
    if (!selectedVariant) return;
    add({
      variantId: selectedVariant.id,
      productSlug: product.slug,
      title: product.title,
      size: selectedVariant.size,
      price: selectedVariant.price,
      imageUrl: product.images[0] ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Gallery */}
      <div className="flex flex-col gap-4">
        <div className="bg-secondary relative aspect-[4/5] overflow-hidden">
          <AnimatePresence mode="wait">
            {product.images[activeImage] ? (
              <motion.div
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={product.images[activeImage]}
                  alt={product.title}
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="text-muted-foreground/40 flex h-full items-center justify-center">
                <ImageIcon className="size-10" />
              </div>
            )}
          </AnimatePresence>
        </div>

        {product.images.length > 1 ? (
          <div className="flex gap-3">
            {product.images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  "bg-secondary relative aspect-square w-16 overflow-hidden transition-opacity",
                  index === activeImage
                    ? "ring-foreground opacity-100 ring-1"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={image}
                  alt=""
                  aria-hidden
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div className="lg:pt-6">
        <div className="lg:sticky lg:top-28">
          {product.brand ? (
            <p className="text-gold text-[11px] font-medium tracking-[0.24em] uppercase">
              {product.brand}
            </p>
          ) : null}
          <h1 className="font-display mt-3 text-3xl leading-tight font-light tracking-tight sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-5 flex items-baseline gap-3">
            <span
              className={cn(
                "text-lg tabular-nums",
                onSale ? "text-gold" : "text-foreground",
              )}
            >
              {formatPaise(product.price)}
            </span>
            {onSale ? (
              <span className="text-muted-foreground text-sm tabular-nums line-through">
                {formatPaise(product.compareAtPrice!)}
              </span>
            ) : null}
          </div>

          {product.description ? (
            <p className="text-muted-foreground mt-8 max-w-md text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          ) : null}

          {hasSizes ? (
            <div className="mt-10">
              <p className="text-foreground/80 text-[12px] font-medium tracking-[0.18em] uppercase">
                Size
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={cn(
                      "flex h-11 min-w-11 items-center justify-center px-4 text-sm tracking-wide transition-colors",
                      size === option
                        ? "bg-foreground text-background"
                        : "border-border text-foreground/85 hover:border-foreground border",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={addToBag}
            disabled={!canAdd}
            className={cn(
              "mt-10 flex h-14 w-full items-center justify-center gap-2 text-[13px] font-medium tracking-[0.2em] uppercase transition-all",
              canAdd
                ? "bg-foreground text-background hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed",
            )}
          >
            {added ? (
              <>
                <Check className="size-4" /> Added to bag
              </>
            ) : !canAdd && hasSizes ? (
              "Select a size"
            ) : !canAdd ? (
              "Currently unavailable"
            ) : (
              "Add to bag"
            )}
          </button>

          <div className="text-muted-foreground border-border mt-10 space-y-2 border-t pt-8 text-xs leading-relaxed">
            <p>Free shipping on orders over ₹2,000.</p>
            <p>Easy 7-day returns. Crafted for longevity.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
