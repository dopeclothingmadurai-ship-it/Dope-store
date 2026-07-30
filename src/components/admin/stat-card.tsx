import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A premium KPI tile: label, large value, optional hint and icon. Shared by the
 * dashboard, analytics and profile surfaces so metrics look identical everywhere.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-card group relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.4)] transition-colors hover:border-white/20",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="font-heading text-2xl font-semibold tracking-tight text-white tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="text-muted-foreground text-xs">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <span className="text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] transition-colors group-hover:text-white">
            <Icon className="size-5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
