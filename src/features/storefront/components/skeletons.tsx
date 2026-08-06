import { cn } from "@/lib/utils";

/** A single shimmering skeleton block. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("dope-skeleton", className)} aria-hidden />;
}

/** Skeleton for a product card (image + title + price line). */
export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="mt-4 flex items-start justify-between gap-3">
        <Skeleton className="h-3.5 w-2/3 rounded" />
        <Skeleton className="h-3.5 w-12 rounded" />
      </div>
    </div>
  );
}

/** A responsive grid of product-card skeletons. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Skeleton for a page heading block. */
export function HeadingSkeleton() {
  return (
    <div className="mb-12">
      <Skeleton className="h-3 w-24 rounded" />
      <Skeleton className="mt-4 h-10 w-64 rounded sm:h-12" />
    </div>
  );
}
