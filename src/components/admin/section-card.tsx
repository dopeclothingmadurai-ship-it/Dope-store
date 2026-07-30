import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A titled content panel in the premium admin style. Used across the dashboard,
 * customer, coupon and settings surfaces so every section reads consistently.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("bg-card rounded-2xl border p-5", className)}>
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            {title ? (
              <h2 className="font-heading text-sm font-semibold text-white">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground text-xs">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
