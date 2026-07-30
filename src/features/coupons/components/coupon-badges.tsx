import { cn } from "@/lib/utils";

import { type CouponStatus } from "../types";

const STYLES: Record<
  CouponStatus,
  { dot: string; pill: string; label: string }
> = {
  active: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    label: "Active",
  },
  scheduled: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    label: "Scheduled",
  },
  expired: {
    dot: "bg-muted-foreground",
    pill: "bg-white/5 text-muted-foreground border-white/10",
    label: "Expired",
  },
  archived: {
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Archived",
  },
};

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        s.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
