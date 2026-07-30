"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  updateFulfillmentStatusAction,
  updateOrderStatusAction,
  updatePaymentStatusAction,
} from "../actions";
import {
  type FulfillmentStatus,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "../types";
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "./order-badges";

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 w-full rounded-lg border px-3 text-sm outline-none transition-colors disabled:opacity-50",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const ORDER_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "partially_refunded", label: "Partially refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "failed", label: "Failed" },
];

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "processing", label: "Processing" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderStatusControls({ order }: { order: Order }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ ok: boolean; error?: { message: string } }>,
  ) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error(res.error?.message ?? "Update failed");
        return;
      }
      toast.success("Order updated");
      router.refresh();
    });
  }

  return (
    <div className="bg-card space-y-4 rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-white">
          Status management
        </h2>
        {pending ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-medium">
              Order status
            </label>
            <OrderStatusBadge status={order.status} />
          </div>
          <select
            aria-label="Order status"
            className={selectClass}
            value={order.status}
            disabled={pending}
            onChange={(event) =>
              run(() =>
                updateOrderStatusAction(
                  order.id,
                  event.target.value as OrderStatus,
                ),
              )
            }
          >
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-medium">
              Payment status
            </label>
            <PaymentStatusBadge status={order.payment_status} />
          </div>
          <select
            aria-label="Payment status"
            className={selectClass}
            value={order.payment_status}
            disabled={pending}
            onChange={(event) =>
              run(() =>
                updatePaymentStatusAction(
                  order.id,
                  event.target.value as PaymentStatus,
                ),
              )
            }
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-muted-foreground text-xs font-medium">
              Fulfillment status
            </label>
            <FulfillmentStatusBadge status={order.fulfillment_status} />
          </div>
          <select
            aria-label="Fulfillment status"
            className={selectClass}
            value={order.fulfillment_status}
            disabled={pending}
            onChange={(event) =>
              run(() =>
                updateFulfillmentStatusAction(
                  order.id,
                  event.target.value as FulfillmentStatus,
                ),
              )
            }
          >
            {FULFILLMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
