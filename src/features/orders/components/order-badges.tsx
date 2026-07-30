import { cn } from "@/lib/utils";

import {
  type FulfillmentStatus,
  type OrderStatus,
  type PaymentStatus,
} from "../types";

type Tone = "neutral" | "emerald" | "amber" | "sky" | "violet" | "red";

const TONE: Record<Tone, { dot: string; pill: string }> = {
  neutral: {
    dot: "bg-muted-foreground",
    pill: "bg-white/5 text-muted-foreground border-white/10",
  },
  emerald: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  amber: {
    dot: "bg-amber-500",
    pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  sky: {
    dot: "bg-sky-500",
    pill: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  violet: {
    dot: "bg-violet-500",
    pill: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  red: {
    dot: "bg-red-500",
    pill: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

function Pill({ label, tone }: { label: string; tone: Tone }) {
  const s = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        s.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {label}
    </span>
  );
}

const ORDER: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "neutral" },
  processing: { label: "Processing", tone: "amber" },
  shipped: { label: "Shipped", tone: "sky" },
  delivered: { label: "Delivered", tone: "emerald" },
  cancelled: { label: "Cancelled", tone: "red" },
};

const PAYMENT: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "neutral" },
  paid: { label: "Paid", tone: "emerald" },
  partially_refunded: { label: "Partially refunded", tone: "amber" },
  refunded: { label: "Refunded", tone: "violet" },
  failed: { label: "Failed", tone: "red" },
};

const FULFILLMENT: Record<FulfillmentStatus, { label: string; tone: Tone }> = {
  unfulfilled: { label: "Unfulfilled", tone: "neutral" },
  processing: { label: "Processing", tone: "amber" },
  packed: { label: "Packed", tone: "sky" },
  shipped: { label: "Shipped", tone: "violet" },
  delivered: { label: "Delivered", tone: "emerald" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Pill {...ORDER[status]} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Pill {...PAYMENT[status]} />;
}

export function FulfillmentStatusBadge({
  status,
}: {
  status: FulfillmentStatus;
}) {
  return <Pill {...FULFILLMENT[status]} />;
}
