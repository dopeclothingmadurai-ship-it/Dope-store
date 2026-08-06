import Link from "next/link";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import {
  AddNoteForm,
  StaffNoteEditor,
} from "@/features/orders/components/order-notes";
import {
  FulfillmentStatusBadge,
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/order-badges";
import { OrderStatusControls } from "@/features/orders/components/order-status-controls";
import { OrderTimeline } from "@/features/orders/components/order-timeline";
import { getOrderDetail } from "@/features/orders/queries";
import { type OrderAddress, type OrderItem } from "@/features/orders/types";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const stampFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-card rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-semibold text-white">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right break-words">{value}</span>
    </div>
  );
}

function parseAddress(value: unknown): OrderAddress | null {
  if (!value || typeof value !== "object") return null;
  return value as OrderAddress;
}

function AddressBlock({ address }: { address: OrderAddress | null }) {
  if (!address) {
    return <p className="text-muted-foreground text-sm">No address on file.</p>;
  }
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
  return (
    <div className="space-y-0.5 text-sm">
      {lines.map((line, index) => (
        <p
          key={index}
          className={index === 0 ? "font-medium" : "text-muted-foreground"}
        >
          {line}
        </p>
      ))}
      {address.phone ? (
        <p className="text-muted-foreground pt-1">{address.phone}</p>
      ) : null}
    </div>
  );
}

function LineItems({ items }: { items: OrderItem[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No items.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border text-muted-foreground border-b text-left text-xs">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 text-right font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Unit</th>
            <th className="pb-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-border/60 border-b last:border-0"
            >
              <td className="py-3 pr-4">
                <div className="font-medium">{item.product_title}</div>
                {item.variant_label ? (
                  <div className="text-muted-foreground text-xs">
                    {item.variant_label}
                  </div>
                ) : null}
                {item.sku ? (
                  <div className="text-muted-foreground/80 font-mono text-xs">
                    {item.sku}
                  </div>
                ) : null}
              </td>
              <td className="py-3 text-right tabular-nums">{item.quantity}</td>
              <td className="py-3 text-right whitespace-nowrap tabular-nums">
                {formatPaise(item.unit_price)}
              </td>
              <td className="py-3 text-right font-medium whitespace-nowrap tabular-nums">
                {formatPaise(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "border-border mt-2 flex items-center justify-between border-t pt-3 text-base font-semibold text-white"
          : "flex items-center justify-between text-sm"
      }
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderDetail(id);
  if (!order) notFound();

  const shipping = parseAddress(order.shipping_address);
  const billing = parseAddress(order.billing_address);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to orders
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5">
            <h1 className="font-heading font-mono text-2xl font-semibold tracking-tight text-white">
              {order.order_number}
            </h1>
            <p className="text-muted-foreground text-sm">
              Placed {stampFmt.format(new Date(order.placed_at))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
            <FulfillmentStatusBadge status={order.fulfillment_status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left / main */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Purchased products">
            <LineItems items={order.items} />
            <div className="mt-5 ml-auto max-w-xs space-y-2">
              <TotalRow label="Subtotal" value={formatPaise(order.subtotal)} />
              {order.discount_total > 0 ? (
                <TotalRow
                  label="Discount"
                  value={`− ${formatPaise(order.discount_total)}`}
                />
              ) : null}
              <TotalRow label="Tax" value={formatPaise(order.tax_total)} />
              <TotalRow
                label="Shipping"
                value={formatPaise(order.shipping_total)}
              />
              <TotalRow
                label="Grand total"
                value={formatPaise(order.grand_total)}
                strong
              />
            </div>
          </SectionCard>

          <SectionCard title="Order timeline">
            <OrderTimeline events={order.events} />
            <div className="border-border mt-5 border-t pt-5">
              <AddNoteForm orderId={order.id} />
            </div>
          </SectionCard>

          {order.customer_note ? (
            <SectionCard title="Customer note">
              <p className="text-sm whitespace-pre-wrap">
                {order.customer_note}
              </p>
            </SectionCard>
          ) : null}
        </div>

        {/* Right / sidebar */}
        <div className="space-y-6">
          <OrderStatusControls order={order} />

          <SectionCard title="Customer">
            <div className="space-y-0.5">
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted-foreground text-sm break-words">
                {order.customer_email}
              </p>
              {order.customer_phone ? (
                <p className="text-muted-foreground text-sm">
                  {order.customer_phone}
                </p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Payment">
            <div className="divide-border/60 divide-y">
              <InfoRow
                label="Status"
                value={<PaymentStatusBadge status={order.payment_status} />}
              />
              <InfoRow
                label="Method"
                value={
                  order.payment_method ? (
                    <span className="capitalize">{order.payment_method}</span>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow label="Channel" value={order.channel} />
              <InfoRow label="Currency" value={order.currency} />
              <InfoRow
                label="Total"
                value={
                  <span className="font-semibold">
                    {formatPaise(order.grand_total)}
                  </span>
                }
              />
              {order.razorpay_payment_id ? (
                <InfoRow
                  label="Razorpay payment"
                  value={
                    <span className="font-mono text-xs">
                      {order.razorpay_payment_id}
                    </span>
                  }
                />
              ) : null}
              {order.razorpay_order_id ? (
                <InfoRow
                  label="Razorpay order"
                  value={
                    <span className="font-mono text-xs">
                      {order.razorpay_order_id}
                    </span>
                  }
                />
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Fulfillment">
            <div className="divide-border/60 divide-y">
              <InfoRow
                label="Method"
                value={
                  order.fulfillment_type === "pickup" ? (
                    <span className="border-success/30 bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium">
                      <span className="bg-success size-1.5 rounded-full" />
                      Pickup
                    </span>
                  ) : (
                    <span className="capitalize">Delivery</span>
                  )
                }
              />
              {order.fulfillment_type === "pickup" ? (
                <>
                  <InfoRow
                    label="Pickup status"
                    value={
                      <span className="capitalize">
                        {(order.pickup_status ?? "pending").replace(/_/g, " ")}
                      </span>
                    }
                  />
                  {order.irl_perks_code ? (
                    <InfoRow
                      label="IRL Perks code"
                      value={
                        <span className="font-mono text-sm font-semibold text-amber-400">
                          {order.irl_perks_code}
                        </span>
                      }
                    />
                  ) : null}
                </>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Shipping address">
            <AddressBlock address={shipping} />
          </SectionCard>

          <SectionCard title="Billing address">
            <AddressBlock address={billing} />
          </SectionCard>

          <SectionCard title="Internal staff notes">
            <StaffNoteEditor
              orderId={order.id}
              initialNote={order.staff_note}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
