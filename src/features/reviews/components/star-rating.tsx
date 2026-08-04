import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star display. `size` maps to a Tailwind size utility. */
export function Stars({
  rating,
  className,
  size = "size-3.5",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  const rounded = Math.round(rating);
  return (
    <div
      className={cn("flex gap-0.5", className)}
      aria-label={`${rating} out of 5`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            size,
            index < rounded
              ? "fill-gold text-gold"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  );
}
