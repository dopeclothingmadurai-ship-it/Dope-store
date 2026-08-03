import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

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
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="bg-secondary relative aspect-[3/4] overflow-hidden">
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
                "object-cover transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "group-hover:scale-[1.03]",
                product.hoverImageUrl && "group-hover:opacity-0",
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
                className="scale-[1.03] object-cover opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
              />
            ) : null}
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
