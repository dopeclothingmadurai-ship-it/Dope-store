import Link from "next/link";
import {
  type LucideIcon,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { type OrderStats } from "../types";

function HeroCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="bg-card group relative overflow-hidden rounded-2xl border p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.4)] transition-colors hover:border-white/20">
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
        <span className="text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] transition-colors group-hover:text-white">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

const STATUS_META: {
  key: keyof OrderStats;
  label: string;
  dot: string;
  value: string;
}[] = [
  {
    key: "pending",
    label: "Pending",
    dot: "bg-muted-foreground",
    value: "pending",
  },
  {
    key: "processing",
    label: "Processing",
    dot: "bg-amber-500",
    value: "processing",
  },
  { key: "shipped", label: "Shipped", dot: "bg-sky-500", value: "shipped" },
  {
    key: "delivered",
    label: "Delivered",
    dot: "bg-emerald-500",
    value: "delivered",
  },
  {
    key: "cancelled",
    label: "Cancelled",
    dot: "bg-red-500",
    value: "cancelled",
  },
];

function StatusChip({
  label,
  count,
  dot,
  href,
}: {
  label: string;
  count: number;
  dot: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card group flex items-center justify-between gap-2 rounded-xl border px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
    >
      <span className="flex items-center gap-2">
        <span className={cn("size-1.5 rounded-full", dot)} />
        <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors">
          {label}
        </span>
      </span>
      <span className="font-heading text-lg font-semibold text-white tabular-nums">
        {count}
      </span>
    </Link>
  );
}

export function OrdersStats({ stats }: { stats: OrderStats }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <HeroCard
          label="Revenue"
          value={formatPaise(stats.revenue)}
          hint="From paid orders"
          icon={IndianRupee}
        />
        <HeroCard
          label="Average Order Value"
          value={formatPaise(stats.averageOrderValue)}
          hint="Per paid order"
          icon={TrendingUp}
        />
        <HeroCard
          label="Total Orders"
          value={stats.total.toLocaleString("en-IN")}
          hint="All time"
          icon={ShoppingBag}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATUS_META.map((meta) => (
          <StatusChip
            key={meta.key}
            label={meta.label}
            count={stats[meta.key] as number}
            dot={meta.dot}
            href={`/admin/orders?status=${meta.value}`}
          />
        ))}
      </div>
    </div>
  );
}
