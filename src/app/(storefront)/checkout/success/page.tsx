import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { IrlPerksCard } from "@/features/checkout/components/irl-perks-card";
import { getOrderDetail } from "@/features/orders/queries";
import { type OrderAddress } from "@/features/orders/types";
import { Reveal } from "@/features/storefront/components/reveal";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order confirmed" };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // ref is the order UUID (unguessable) — the only way to view this invoice.
  if (!ref || !UUID_RE.test(ref)) notFound();

  const order = await getOrderDetail(ref);
  if (!order) notFound();

  const address = order.shipping_address as OrderAddress | null;
  const isPickup = order.fulfillment_type === "pickup";
  const placedDateObj = new Date(order.placed_at);
  const placedAt = placedDateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const placedTime = placedDateObj.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-2xl px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <Reveal className="text-center">
        <span className="border-gold text-gold mx-auto flex size-14 items-center justify-center rounded-full border">
          <Check className="size-6" />
        </span>
        <p className="text-gold mt-6 text-[11px] font-medium tracking-[0.3em] uppercase">
          Order confirmed
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Thank you
          {order.customer_name ? `, ${order.customer_name.split(" ")[0]}` : ""}.
        </h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-relaxed">
          Your order is in. A confirmation email is on its way — keep your order
          number handy.
        </p>
      </Reveal>

      {/* On-screen invoice */}
      <Reveal delay={0.1} className="mt-12">
        <div className="border-border bg-card rounded-2xl border p-7 sm:p-9">
          <div className="border-border grid grid-cols-2 gap-y-5 border-b pb-6 sm:grid-cols-4">
            <Meta label="Order" value={order.order_number} />
            <Meta label="Date" value={placedAt} />
            <Meta label="Payment" value={cap(order.payment_status)} />
            <Meta
              label="Fulfillment"
              value={isPickup ? "Store pickup" : "Home delivery"}
            />
          </div>

          <ul className="divide-y divide-[color:var(--border)]">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="text-foreground text-sm">
                    {item.product_title}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {item.variant_label ? `${item.variant_label} · ` : ""}
                    Qty {item.quantity}
                  </p>
                </div>
                <span className="text-foreground text-sm whitespace-nowrap tabular-nums">
                  {formatPaise(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <div className="border-border mt-2 space-y-2 border-t pt-5 text-sm">
            <Row label="Subtotal" value={formatPaise(order.subtotal)} />
            {order.discount_total > 0 ? (
              <Row
                label="Discount"
                value={`– ${formatPaise(order.discount_total)}`}
              />
            ) : null}
            {!isPickup ? (
              <Row
                label="Shipping"
                value={
                  order.shipping_total > 0
                    ? formatPaise(order.shipping_total)
                    : "Free"
                }
              />
            ) : null}
            <div className="border-border mt-2 flex items-center justify-between border-t pt-3 text-base font-medium">
              <span>Total paid</span>
              <span className="tabular-nums">
                {formatPaise(order.grand_total)}
              </span>
            </div>
          </div>

          {/* Fulfillment detail */}
          <div className="border-border mt-6 border-t pt-6">
            <p className="text-gold text-[11px] font-medium tracking-[0.2em] uppercase">
              {isPickup ? "Pickup" : "Shipping to"}
            </p>
            {isPickup ? (
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                Collect from the nearest Dope Store once your order is
                confirmed. Show your order number or confirmation email.
              </p>
            ) : (
              <p className="text-foreground/85 mt-3 text-sm leading-relaxed whitespace-pre-line">
                {[
                  address?.name,
                  address?.line1,
                  address?.line2,
                  [address?.city, address?.state, address?.pincode]
                    .filter(Boolean)
                    .join(", "),
                ]
                  .filter(Boolean)
                  .join("\n")}
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {isPickup && order.irl_perks_code ? (
        <Reveal delay={0.15} className="mt-6">
          <IrlPerksCard
            code={order.irl_perks_code}
            orderNumber={order.order_number}
            orderDate={placedAt}
            orderTime={placedTime}
          />
        </Reveal>
      ) : null}

      <Reveal delay={0.2} className="mt-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/account"
          className="bg-foreground text-background flex h-12 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
        >
          View my orders
        </Link>
        <Link
          href="/shop"
          className="border-border hover:border-foreground text-foreground flex h-12 items-center justify-center border px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-colors"
        >
          Continue shopping
        </Link>
      </Reveal>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground/70 text-[10px] font-medium tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
