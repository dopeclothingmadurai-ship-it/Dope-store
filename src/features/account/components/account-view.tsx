import Link from "next/link";
import { Package } from "lucide-react";

import { formatPaise } from "@/lib/money";

import { type AccountOrder } from "../types";
import { SignOutButton } from "./sign-out-button";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AccountView({
  name,
  email,
  orders,
}: {
  name: string;
  email: string;
  orders: AccountOrder[];
}) {
  return (
    <div className="mx-auto max-w-[900px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36">
      <header className="border-border flex items-end justify-between gap-6 border-b pb-8">
        <div>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            Your account
          </p>
          <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
            {name}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm">{email}</p>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-14">
        <h2 className="text-foreground/80 text-[12px] font-medium tracking-[0.2em] uppercase">
          Order history
        </h2>

        {orders.length === 0 ? (
          <div className="border-border mt-6 flex flex-col items-center border border-dashed px-6 py-16 text-center">
            <Package
              className="text-muted-foreground/50 size-8"
              strokeWidth={1.5}
            />
            <p className="text-muted-foreground mt-4 text-sm">
              You have no orders yet.
            </p>
            <Link
              href="/shop"
              className="text-foreground hover:text-gold mt-4 text-[12px] font-medium tracking-[0.16em] uppercase underline underline-offset-4 transition-colors"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-[color:var(--border)]">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 py-5"
              >
                <div>
                  <p className="text-foreground text-sm font-medium tracking-wide">
                    {order.orderNumber}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {formatDate(order.placedAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground text-[11px] font-medium tracking-[0.16em] uppercase">
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-foreground text-sm tabular-nums">
                    {formatPaise(order.grandTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
