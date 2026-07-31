"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Eye,
  MoreHorizontal,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/admin/empty-state";
import { ExportButton } from "@/components/admin/export-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { updateFulfillmentStatusAction } from "../actions";
import {
  type FulfillmentStatus,
  type OrderListItem,
  type OrderListResult,
  type OrderSort,
  type OrderStatus,
  type PaymentStatus,
} from "../types";
import { FulfillmentStatusBadge, PaymentStatusBadge } from "./order-badges";

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 rounded-lg border px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "placed_at:desc", label: "Newest first" },
  { value: "placed_at:asc", label: "Oldest first" },
  { value: "grand_total:desc", label: "Total: high to low" },
  { value: "grand_total:asc", label: "Total: low to high" },
  { value: "order_number:asc", label: "Order № A–Z" },
  { value: "status:asc", label: "Status" },
];

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

function PaymentMethod({ method }: { method: string | null }) {
  if (!method) return <span className="text-muted-foreground/70">—</span>;
  return <span className="text-muted-foreground capitalize">{method}</span>;
}

function QuickActions({
  order,
  onFulfillment,
}: {
  order: OrderListItem;
  onFulfillment: (order: OrderListItem, status: FulfillmentStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Order actions" />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem render={<Link href={`/admin/orders/${order.id}`} />}>
          <Eye /> View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={order.fulfillment_status === "packed"}
          onClick={() => onFulfillment(order, "packed")}
        >
          <PackageCheck /> Mark packed
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={order.fulfillment_status === "shipped"}
          onClick={() => onFulfillment(order, "shipped")}
        >
          <Truck /> Mark shipped
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={order.fulfillment_status === "delivered"}
          onClick={() => onFulfillment(order, "delivered")}
        >
          <PackageCheck /> Mark delivered
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OrdersManager({
  result,
  search,
}: {
  result: OrderListResult;
  search: string;
}) {
  const router = useRouter();
  const { filters } = result;
  const [term, setTerm] = useState(search);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtersActive = Boolean(
    search || filters.status || filters.paymentStatus,
  );
  const animationKey = `${result.page}:${result.sort}:${result.dir}:${search}:${filters.status}:${filters.paymentStatus}`;

  function navigate(next: {
    page?: number;
    q?: string;
    status?: OrderStatus | null;
    payment?: PaymentStatus | null;
    sort?: OrderSort;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    if (q) params.set("q", q);

    const status = next.status !== undefined ? next.status : filters.status;
    if (status) params.set("status", status);
    const payment =
      next.payment !== undefined ? next.payment : filters.paymentStatus;
    if (payment) params.set("payment", payment);

    const sort = next.sort ?? result.sort;
    const dir = next.dir ?? result.dir;
    if (sort !== "placed_at" || dir !== "desc") {
      params.set("sort", sort);
      params.set("dir", dir);
    }

    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  function toggleSort(column: OrderSort) {
    const dir: "asc" | "desc" =
      result.sort === column && result.dir === "asc" ? "desc" : "asc";
    navigate({ sort: column, dir, page: 1 });
  }

  function SortIcon({ column }: { column: OrderSort }) {
    if (result.sort !== column)
      return <ChevronsUpDown className="text-muted-foreground/40 size-3.5" />;
    return result.dir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  }

  function clearFilters() {
    setTerm("");
    navigate({ q: "", status: null, payment: null, page: 1 });
  }

  async function handleFulfillment(
    order: OrderListItem,
    status: FulfillmentStatus,
  ) {
    const res = await updateFulfillmentStatusAction(order.id, status);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`${order.order_number} marked ${status}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ q: term, page: 1 });
            }}
            className="relative min-w-[200px] flex-1 sm:max-w-xs"
          >
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search orders, customers…"
              className="h-9 rounded-lg pl-9"
            />
          </form>

          <select
            aria-label="Filter by order status"
            className={selectClass}
            value={filters.status ?? ""}
            onChange={(event) =>
              navigate({
                status: (event.target.value || null) as OrderStatus | null,
                page: 1,
              })
            }
          >
            <option value="">All status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            aria-label="Filter by payment status"
            className={selectClass}
            value={filters.paymentStatus ?? ""}
            onChange={(event) =>
              navigate({
                payment: (event.target.value || null) as PaymentStatus | null,
                page: 1,
              })
            }
          >
            <option value="">All payments</option>
            <option value="pending">Payment pending</option>
            <option value="paid">Paid</option>
            <option value="partially_refunded">Partially refunded</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          <select
            aria-label="Sort orders"
            className={selectClass}
            value={`${result.sort}:${result.dir}`}
            onChange={(event) => {
              const [sort, dir] = event.target.value.split(":") as [
                OrderSort,
                "asc" | "desc",
              ];
              navigate({ sort, dir, page: 1 });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {filtersActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X /> Clear
            </Button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="text-muted-foreground text-sm tabular-nums">
            {result.total} {result.total === 1 ? "Order" : "Orders"}
          </p>
          <ExportButton entity="orders" />
        </div>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={search || filtersActive ? "No orders found" : "No orders yet"}
          description={
            search || filtersActive
              ? "Try adjusting your search or filters."
              : "Orders placed by customers will appear here."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-4"
        >
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border xl:block">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("order_number")}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      Order <SortIcon column="order_number" />
                    </button>
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Customer
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("placed_at")}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      Date <SortIcon column="placed_at" />
                    </button>
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Payment
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Fulfillment
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Method
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    Items
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("grand_total")}
                      className="hover:text-foreground ml-auto flex items-center gap-1"
                    >
                      Total <SortIcon column="grand_total" />
                    </button>
                  </th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((order) => (
                  <tr
                    key={order.id}
                    className="border-border/70 group border-b transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-medium hover:underline"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-0 leading-tight">
                        <div className="truncate font-medium">
                          {order.customer_name}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {order.customer_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="leading-tight">
                        <div className="whitespace-nowrap">
                          {dateFmt.format(new Date(order.placed_at))}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {timeFmt.format(new Date(order.placed_at))}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PaymentStatusBadge status={order.payment_status} />
                    </td>
                    <td className="px-5 py-4">
                      <FulfillmentStatusBadge
                        status={order.fulfillment_status}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <PaymentMethod method={order.payment_method} />
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {order.itemCount}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold whitespace-nowrap tabular-nums">
                      {formatPaise(order.grand_total)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <QuickActions
                        order={order}
                        onFulfillment={handleFulfillment}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid gap-3 xl:hidden">
            {result.items.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-2xl border p-4 transition-colors hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-xs font-medium hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="mt-1 truncate font-medium">
                      {order.customer_name}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {order.customer_email}
                    </div>
                  </div>
                  <QuickActions
                    order={order}
                    onFulfillment={handleFulfillment}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PaymentStatusBadge status={order.payment_status} />
                  <FulfillmentStatusBadge status={order.fulfillment_status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm">
                  <div className="text-muted-foreground">
                    {dateFmt.format(new Date(order.placed_at))} ·{" "}
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </div>
                  <div className="font-semibold tabular-nums">
                    {formatPaise(order.grand_total)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-muted-foreground text-sm">
              Page {result.page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={result.page <= 1}
                onClick={() => navigate({ page: result.page - 1 })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={result.page >= totalPages}
                onClick={() => navigate({ page: result.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
