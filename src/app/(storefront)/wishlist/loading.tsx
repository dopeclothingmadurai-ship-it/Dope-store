import {
  HeadingSkeleton,
  ProductGridSkeleton,
} from "@/features/storefront/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
      <HeadingSkeleton />
      <ProductGridSkeleton />
    </div>
  );
}
