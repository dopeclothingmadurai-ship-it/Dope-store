import { Skeleton } from "@/features/storefront/components/skeletons";

export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-8 sm:px-8 sm:pt-32">
      <Skeleton className="mb-8 h-3 w-40 rounded" />
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="lg:pt-6">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="mt-4 h-9 w-3/4 rounded" />
          <Skeleton className="mt-6 h-5 w-28 rounded" />
          <Skeleton className="mt-8 h-20 w-full max-w-md rounded" />
          <div className="mt-10 flex gap-2">
            <Skeleton className="h-11 w-14 rounded" />
            <Skeleton className="h-11 w-14 rounded" />
            <Skeleton className="h-11 w-14 rounded" />
          </div>
          <Skeleton className="mt-10 h-14 w-full rounded" />
          <Skeleton className="mt-3 h-12 w-full rounded" />
        </div>
      </div>
    </div>
  );
}
