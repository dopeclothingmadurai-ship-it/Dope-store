import { Skeleton } from "@/components/ui/skeleton";

export default function CatalogLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-9 w-full max-w-sm" />
      <div className="space-y-2 rounded-xl border p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
