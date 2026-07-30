import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { type OrderAddress } from "@/features/orders/types";

import {
  type CustomerDetail,
  type CustomerListResult,
  type CustomerSort,
  type CustomerStats,
} from "./types";

export const CUSTOMERS_PAGE_SIZE = 20;

/** Paginated, searchable, sortable customer directory with order aggregates. */
export async function listCustomers(params: {
  page?: number;
  search?: string;
  sort?: CustomerSort;
  dir?: "asc" | "desc";
}): Promise<CustomerListResult> {
  const db = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = CUSTOMERS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort: CustomerSort = params.sort ?? "created";
  const ascending = params.dir === "asc";

  let query = db.from("customers").select("*", { count: "exact" });
  const search = params.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(
      `name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    );
  }

  const orderColumn = sort === "name" ? "name" : "created_at";
  const { data, error, count } = await query
    .order(orderColumn, { ascending, nullsFirst: false })
    .range(from, to);
  if (error) throw fromPostgrestError(error);

  const ids = data.map((customer) => customer.id);
  const agg = new Map<
    string,
    { orderCount: number; totalSpend: number; lastOrderAt: string | null }
  >();
  if (ids.length > 0) {
    const { data: orders, error: ordersError } = await db
      .from("orders")
      .select("customer_id, grand_total, payment_status, placed_at")
      .in("customer_id", ids);
    if (ordersError) throw fromPostgrestError(ordersError);
    for (const order of orders) {
      if (!order.customer_id) continue;
      const current = agg.get(order.customer_id) ?? {
        orderCount: 0,
        totalSpend: 0,
        lastOrderAt: null,
      };
      current.orderCount += 1;
      if (order.payment_status === "paid") {
        current.totalSpend += order.grand_total;
      }
      if (!current.lastOrderAt || order.placed_at > current.lastOrderAt) {
        current.lastOrderAt = order.placed_at;
      }
      agg.set(order.customer_id, current);
    }
  }

  return {
    items: data.map((customer) => {
      const stats = agg.get(customer.id);
      return {
        ...customer,
        orderCount: stats?.orderCount ?? 0,
        totalSpend: stats?.totalSpend ?? 0,
        lastOrderAt: stats?.lastOrderAt ?? null,
      };
    }),
    total: count ?? 0,
    page,
    pageSize,
    sort,
    dir: ascending ? "asc" : "desc",
  };
}

function isAddress(value: unknown): value is OrderAddress {
  return typeof value === "object" && value !== null;
}

export async function getCustomerDetail(
  id: string,
): Promise<CustomerDetail | null> {
  const db = createAdminClient();

  const { data: customer, error } = await db
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!customer) return null;

  const { data: orders, error: ordersError } = await db
    .from("orders")
    .select("*")
    .eq("customer_id", id)
    .order("placed_at", { ascending: false });
  if (ordersError) throw fromPostgrestError(ordersError);

  let totalSpend = 0;
  let paidCount = 0;
  let firstOrderAt: string | null = null;
  let lastOrderAt: string | null = null;
  const addresses: OrderAddress[] = [];
  const seenAddresses = new Set<string>();

  for (const order of orders) {
    if (order.payment_status === "paid") {
      totalSpend += order.grand_total;
      paidCount += 1;
    }
    if (!firstOrderAt || order.placed_at < firstOrderAt) {
      firstOrderAt = order.placed_at;
    }
    if (!lastOrderAt || order.placed_at > lastOrderAt) {
      lastOrderAt = order.placed_at;
    }
    if (isAddress(order.shipping_address)) {
      const key = JSON.stringify(order.shipping_address);
      if (!seenAddresses.has(key)) {
        seenAddresses.add(key);
        addresses.push(order.shipping_address);
      }
    }
  }

  const stats: CustomerStats = {
    totalOrders: orders.length,
    totalSpend,
    averageOrderValue: paidCount > 0 ? Math.round(totalSpend / paidCount) : 0,
    firstOrderAt,
    lastOrderAt,
  };

  return { customer, stats, orders, addresses };
}
