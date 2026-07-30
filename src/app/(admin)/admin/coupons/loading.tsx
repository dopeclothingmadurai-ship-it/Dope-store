import { Skeleton } from "@/components/ui/skeleton";

export default function CouponsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-64 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
