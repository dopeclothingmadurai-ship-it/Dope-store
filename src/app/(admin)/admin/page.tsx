import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  IndianRupee,
  Package,
  ShoppingBag,
  Store,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";

import { SectionCard } from "@/components/admin/section-card";
import { StatCard } from "@/components/admin/stat-card";
import { PaymentStatusBadge } from "@/features/orders/components/order-badges";
import { RevenueAreaChart } from "@/features/analytics/components/analytics-charts";
import { getAnalytics } from "@/features/analytics/queries";
import { resolveRange } from "@/features/analytics/range";
import { getAuthUser } from "@/lib/auth/staff";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

const timeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const QUICK_LINKS = [
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Products", href: "/admin/catalog/products", icon: Package },
  { label: "Coupons", href: "/admin/coupons", icon: Ticket },
  { label: "Offline billing", href: "/admin/pos", icon: Store },
];

export default async function DashboardPage() {
  const [user, data] = await Promise.all([
    getAuthUser(),
    getAnalytics(resolveRange("30d")),
  ]);

  const name = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white capitalize">
          Welcome back, {name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Here is how Dope Store performed over the last 30 days.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPaise(data.kpis.revenue)}
          hint="Last 30 days"
          icon={IndianRupee}
        />
        <StatCard
          label="Orders"
          value={data.kpis.orders.toLocaleString("en-IN")}
          hint="Last 30 days"
          icon={ShoppingBag}
        />
        <StatCard
          label="Customers"
          value={data.kpis.customers.toLocaleString("en-IN")}
          hint="Active buyers"
          icon={Users}
        />
        <StatCard
          label="Avg order"
          value={formatPaise(data.kpis.averageOrderValue)}
          hint="Per paid order"
          icon={TrendingUp}
        />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card group flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
          >
            <span className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06] transition-colors group-hover:text-white">
              <link.icon className="size-4" />
            </span>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      <SectionCard
        title="Revenue"
        description="Last 30 days"
        action={
          <Link
            href="/admin/analytics"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
          >
            View analytics <ArrowRight className="size-3.5" />
          </Link>
        }
      >
        <RevenueAreaChart series={data.series} />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Recent sales"
          bodyClassName="overflow-x-auto"
          action={
            <Link
              href="/admin/orders"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
            >
              All orders <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {data.recentSales.length === 0 ? (
            <p className="text-muted-foreground text-sm">No recent sales.</p>
          ) : (
            <table className="w-full text-sm">
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
                    <td className="text-muted-foreground hidden py-2.5 pr-4 whitespace-nowrap sm:table-cell">
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

        <SectionCard title="Best customers">
          {data.bestCustomers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No customers yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.bestCustomers.slice(0, 5).map((customer, index) => (
                <li
                  key={`${customer.id ?? customer.email}-${index}`}
                  className="flex items-center gap-3"
                >
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
                      {customer.email}
                    </div>
                  </div>
                  <span className="font-semibold tabular-nums">
                    {formatPaise(customer.spend)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
