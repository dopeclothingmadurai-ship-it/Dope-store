import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";

import { SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/order-badges";
import { CustomerNoteEditor } from "@/features/customers/components/customer-note-editor";
import { getCustomerDetail } from "@/features/customers/queries";
import { type OrderAddress } from "@/features/customers/types";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const stampFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function AddressBlock({ address }: { address: OrderAddress }) {
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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  if (!detail) notFound();

  const { customer, stats, orders, addresses } = detail;
  const recentOrders = orders.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/admin/customers"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to customers
        </Link>
        <div className="flex items-center gap-4">
          <span className="bg-muted flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ring-1 ring-white/10">
            {(
              (customer.name?.trim() || customer.email).charAt(0) || "?"
            ).toUpperCase()}
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-white">
              {customer.name ?? "Guest customer"}
            </h1>
            <p className="text-muted-foreground text-sm break-words">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total orders"
          value={stats.totalOrders.toLocaleString("en-IN")}
          icon={ShoppingBag}
        />
        <StatCard
          label="Total spend"
          value={formatPaise(stats.totalSpend)}
          hint="Paid orders"
          icon={IndianRupee}
        />
        <StatCard
          label="Average order"
          value={formatPaise(stats.averageOrderValue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Customer since"
          value={
            stats.firstOrderAt
              ? dateFmt.format(new Date(stats.firstOrderAt))
              : "—"
          }
          hint={
            stats.lastOrderAt
              ? `Last order ${dateFmt.format(new Date(stats.lastOrderAt))}`
              : undefined
          }
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left / main */}
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Recent orders" bodyClassName="overflow-x-auto">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border text-muted-foreground border-b text-left text-xs">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Payment</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-border/60 border-b last:border-0"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono text-xs font-medium hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="text-muted-foreground py-3 pr-4 whitespace-nowrap">
                        {dateFmt.format(new Date(order.placed_at))}
                      </td>
                      <td className="py-3 pr-4">
                        <PaymentStatusBadge status={order.payment_status} />
                      </td>
                      <td className="py-3 text-right font-medium whitespace-nowrap tabular-nums">
                        {formatPaise(order.grand_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Timeline">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            ) : (
              <ol className="relative space-y-5">
                {orders.map((order, index) => {
                  const isLast = index === orders.length - 1;
                  return (
                    <li key={order.id} className="relative flex gap-3.5">
                      {!isLast ? (
                        <span className="absolute top-8 left-[15px] h-[calc(100%-4px)] w-px bg-white/[0.08]" />
                      ) : null}
                      <span className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white ring-1 ring-white/10">
                        <ShoppingBag className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-sm leading-snug">
                          Placed{" "}
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="font-mono font-medium hover:underline"
                          >
                            {order.order_number}
                          </Link>{" "}
                          for{" "}
                          <span className="font-medium">
                            {formatPaise(order.grand_total)}
                          </span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <OrderStatusBadge status={order.status} />
                          <span className="text-muted-foreground text-xs">
                            {stampFmt.format(new Date(order.placed_at))}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>
        </div>

        {/* Right / sidebar */}
        <div className="space-y-6">
          <SectionCard title="Contact">
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">{customer.name ?? "Guest"}</p>
              <p className="text-muted-foreground break-words">
                {customer.email}
              </p>
              {customer.phone ? (
                <p className="text-muted-foreground">{customer.phone}</p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Shipping addresses">
            {addresses.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No addresses on file.
              </p>
            ) : (
              <div className="space-y-4">
                {addresses.map((address, index) => (
                  <div
                    key={index}
                    className="border-border/60 not-first:border-t not-first:pt-4"
                  >
                    <AddressBlock address={address} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Staff notes">
            <CustomerNoteEditor
              customerId={customer.id}
              initialNote={customer.note}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
