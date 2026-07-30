import { OrdersManager } from "@/features/orders/components/orders-manager";
import { OrdersStats } from "@/features/orders/components/orders-stats";
import { getOrderStats, listOrders } from "@/features/orders/queries";
import {
  type OrderSort,
  type OrderStatus,
  type PaymentStatus,
} from "@/features/orders/types";

export const dynamic = "force-dynamic";

const SORTS: OrderSort[] = [
  "placed_at",
  "grand_total",
  "order_number",
  "status",
];
const STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENTS: PaymentStatus[] = [
  "pending",
  "paid",
  "partially_refunded",
  "refunded",
  "failed",
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
    status?: string;
    payment?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sort: OrderSort = SORTS.includes(params.sort as OrderSort)
    ? (params.sort as OrderSort)
    : "placed_at";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";
  const status: OrderStatus | null = STATUSES.includes(
    params.status as OrderStatus,
  )
    ? (params.status as OrderStatus)
    : null;
  const paymentStatus: PaymentStatus | null = PAYMENTS.includes(
    params.payment as PaymentStatus,
  )
    ? (params.payment as PaymentStatus)
    : null;

  const [stats, result] = await Promise.all([
    getOrderStats(),
    listOrders({ page, search, sort, dir, status, paymentStatus }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm">
          Track fulfillment, payments and the complete order lifecycle.
        </p>
      </div>

      <OrdersStats stats={stats} />
      <OrdersManager result={result} search={search} />
    </div>
  );
}
