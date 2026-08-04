"use client";

import { DragRail } from "./drag-rail";
import { ProductCard } from "./product-card";
import { type StoreProductCard } from "../types";

/**
 * A horizontal, drag-scrollable rail of product cards. Bleeds to the viewport
 * edges so the last card peeks — a premium editorial cue to keep scrolling.
 */
export function ProductRail({
  products,
  priority = false,
}: {
  products: StoreProductCard[];
  priority?: boolean;
}) {
  return (
    <DragRail className="-mx-5 gap-4 px-5 pb-2 sm:-mx-8 sm:gap-6 sm:px-8">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="w-[68vw] max-w-[300px] shrink-0 snap-start sm:w-[320px]"
        >
          <ProductCard product={product} priority={priority && index < 3} />
        </div>
      ))}
    </DragRail>
  );
}
