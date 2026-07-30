import Link from "next/link";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import { SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { PaymentStatusBadge } from "@/features/orders/components/order-badges";
import {
  BreakdownDonut,
  OrdersBarChart,
  RevenueAreaChart,
} from "@/features/analytics/components/analytics-charts";
import { RangeFilter } from "@/features/analytics/components/range-filter";
import { getAnalytics } from "@/features/analytics/queries";
import { resolveRange } from "@/features/analytics/range";
import { type DateRangeKey } from "@/features/analytics/types";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const RANGE_KEYS: DateRangeKey[] = [
  "today",
  "7d",
  "30d",
  "90d",
  "year",
  "custom",
];

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const key: DateRangeKey = RANGE_KEYS.includes(params.range as DateRangeKey)
    ? (params.range as DateRangeKey)
    : "30d";
  const range = resolveRange(key, params.from, params.to);
  const data = await getAnalytics(range);

  const maxCategoryRevenue = Math.max(
    1,
    ...data.topCategories.map((category) => category.revenue),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            {data.range.label} · store performance at a glance.
          </p>
        </div>
        <RangeFilter active={range.key} from={params.from} to={params.to} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue"
          value={formatPaise(data.kpis.revenue)}
          icon={IndianRupee}
        />
        <StatCard
          label="Orders"
          value={data.kpis.orders.toLocaleString("en-IN")}
          icon={ShoppingBag}
        />
        <StatCard
          label="Customers"
          value={data.kpis.customers.toLocaleString("en-IN")}
          icon={Users}
        />
        <StatCard
          label="Avg order"
          value={formatPaise(data.kpis.averageOrderValue)}
          icon={TrendingUp}
        />
        <StatCard
          label="Units sold"
          value={data.kpis.unitsSold.toLocaleString("en-IN")}
          icon={Package}
        />
        <StatCard
          label="Paid orders"
          value={data.kpis.paidOrders.toLocaleString("en-IN")}
        />
      </div>

      {/* Revenue */}
      <SectionCard title="Revenue" description={data.range.label}>
        <RevenueAreaChart series={data.series} />
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Orders" className="xl:col-span-2">
          <OrdersBarChart series={data.series} />
        </SectionCard>
        <SectionCard title="Order status">
          <BreakdownDonut
            suffix="orders"
            data={data.statusBreakdown.map((entry) => ({
              name: STATUS_LABELS[entry.status] ?? entry.status,
              value: entry.count,
            }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Top selling products"
          bodyClassName="overflow-x-auto"
        >
          {data.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No sales in this range.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border text-muted-foreground border-b text-left text-xs">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 text-right font-medium">Units</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product) => (
                  <tr
                    key={product.key}
                    className="border-border/60 border-b last:border-0"
                  >
                    <td className="py-2.5 pr-4 font-medium">{product.title}</td>
                    <td className="text-muted-foreground py-2.5 text-right tabular-nums">
                      {product.units}
                    </td>
                    <td className="py-2.5 text-right font-medium tabular-nums">
                      {formatPaise(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>

        <SectionCard title="Top categories">
          {data.topCategories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No sales in this range.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.topCategories.map((category) => (
                <li key={category.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatPaise(category.revenue)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-emerald-500/70"
                      style={{
                        width: `${Math.max(
                          4,
                          (category.revenue / maxCategoryRevenue) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Best customers">
          {data.bestCustomers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No customers in this range.
            </p>
          ) : (
            <ul className="space-y-3">
              {data.bestCustomers.map((customer, index) => (
                <li key={`${customer.id ?? customer.email}-${index}`}>
                  <div className="flex items-center gap-3">
                    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/10">
                      {(customer.name.charAt(0) || "?").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      {customer.id ? (
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {customer.name}
                        </Link>
                      ) : (
                        <span className="truncate font-medium">
                          {customer.name}
                        </span>
                      )}
                      <div className="text-muted-foreground truncate text-xs">
                        {customer.orders}{" "}
                        {customer.orders === 1 ? "order" : "orders"}
                      </div>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatPaise(customer.spend)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Payment methods">
          <BreakdownDonut
            suffix="orders"
            data={data.paymentBreakdown.map((entry) => ({
              name: entry.label,
              value: entry.count,
            }))}
          />
        </SectionCard>
      </div>

      <SectionCard title="Recent sales" bodyClassName="overflow-x-auto">
        {data.recentSales.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent sales.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border text-muted-foreground border-b text-left text-xs">
                <th className="pb-2 font-medium">Order</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">When</th>
                <th className="pb-2 font-medium">Payment</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-border/60 border-b last:border-0"
                >
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/admin/orders/${sale.id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {sale.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">{sale.customer}</td>
                  <td className="text-muted-foreground py-2.5 pr-4 whitespace-nowrap">
                    {timeFmt.format(new Date(sale.placedAt))}
                  </td>
                  <td className="py-2.5 pr-4">
                    <PaymentStatusBadge status={sale.paymentStatus} />
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums">
                    {formatPaise(sale.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
    </div>
  );
}
