"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import { ProductCard } from "./product-card";
import { Reveal } from "./reveal";
import { type StoreProductCard } from "../types";

type Sort = "new" | "price-asc" | "price-desc";

const SORTS: { value: Sort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export function ShopGrid({ products }: { products: StoreProductCard[] }) {
  const [sort, setSort] = useState<Sort>("new");

  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort]);

  return (
    <div>
      <div className="border-border mb-10 flex items-center justify-between border-b pb-5">
        <p className="text-muted-foreground text-[12px] tracking-[0.16em] uppercase tabular-nums">
          {products.length} {products.length === 1 ? "Piece" : "Pieces"}
        </p>
        <label className="flex items-center gap-3">
          <span className="text-muted-foreground text-[12px] tracking-[0.16em] uppercase">
            Sort
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className={cn(
              "text-foreground border-border bg-transparent py-1 text-[13px] tracking-wide outline-none",
              "focus-visible:border-foreground border-b transition-colors",
            )}
          >
            {SORTS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-background text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground py-24 text-center text-sm">
          Nothing here yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {sorted.map((product, index) => (
            <Reveal key={product.id} delay={(index % 4) * 0.05}>
              <ProductCard product={product} priority={index < 4} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
