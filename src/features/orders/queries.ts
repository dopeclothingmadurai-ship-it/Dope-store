import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type OrderDetail,
  type OrderListResult,
  type OrderSort,
  type OrderStats,
  type OrderStatus,
  type PaymentStatus,
} from "./types";

export const ORDERS_PAGE_SIZE = 20;

const SORT_COLUMNS: Record<
  OrderSort,
  "placed_at" | "grand_total" | "order_number" | "status"
> = {
  placed_at: "placed_at",
  grand_total: "grand_total",
  order_number: "order_number",
  status: "status",
};

/** Dashboard statistics: order counts by status, paid revenue and AOV. */
export async function getOrderStats(): Promise<OrderStats> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .select("status, payment_status, grand_total");
  if (error) throw fromPostgrestError(error);

  const stats: OrderStats = {
    total: data.length,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    averageOrderValue: 0,
  };

  let paidCount = 0;
  for (const order of data) {
    stats[order.status] += 1;
    if (order.payment_status === "paid") {
      stats.revenue += order.grand_total;
      paidCount += 1;
    }
  }
  stats.averageOrderValue =
    paidCount > 0 ? Math.round(stats.revenue / paidCount) : 0;

  return stats;
}

/** Paginated, searchable, filterable, sortable order list with item counts. */
export async function listOrders(params: {
  page?: number;
  search?: string;
  status?: OrderStatus | null;
  paymentStatus?: PaymentStatus | null;
  sort?: OrderSort;
  dir?: "asc" | "desc";
}): Promise<OrderListResult> {
  const db = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = ORDERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort: OrderSort = params.sort ?? "placed_at";
  const ascending = params.dir === "asc";
  const status = params.status ?? null;
  const paymentStatus = params.paymentStatus ?? null;

  let query = db.from("orders").select("*", { count: "exact" });
  const search = params.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(
      `order_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
    );
  }
  if (status) query = query.eq("status", status);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);

  const { data, error, count } = await query
    .order(SORT_COLUMNS[sort], { ascending })
    .range(from, to);
  if (error) throw fromPostgrestError(error);

  const itemCounts = new Map<string, number>();
  const orderIds = data.map((order) => order.id);
  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await db
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", orderIds);
    if (itemsError) throw fromPostgrestError(itemsError);
    for (const item of items) {
      itemCounts.set(
        item.order_id,
        (itemCounts.get(item.order_id) ?? 0) + item.quantity,
      );
    }
  }

  return {
    items: data.map((order) => ({
      ...order,
      itemCount: itemCounts.get(order.id) ?? 0,
    })),
    total: count ?? 0,
    page,
    pageSize,
    sort,
    dir: ascending ? "asc" : "desc",
    filters: { status, paymentStatus },
  };
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const db = createAdminClient();

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!order) return null;

  const [itemsResult, eventsResult] = await Promise.all([
    db
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    db
      .from("order_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (itemsResult.error) throw fromPostgrestError(itemsResult.error);
  if (eventsResult.error) throw fromPostgrestError(eventsResult.error);

  return { ...order, items: itemsResult.data, events: eventsResult.data };
}
