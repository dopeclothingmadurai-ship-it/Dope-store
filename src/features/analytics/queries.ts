import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { type OrderStatus } from "@/features/orders/types";

import {
  type AnalyticsData,
  type BestCustomer,
  type Breakdown,
  type ResolvedRange,
  type SeriesPoint,
  type TopCategory,
  type TopProduct,
} from "./types";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const dayLabel = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
});
const monthLabel = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "2-digit",
});

function bucketKey(date: Date, granularity: "day" | "month"): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  if (granularity === "month") return `${y}-${m}`;
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildBuckets(range: ResolvedRange): Map<string, SeriesPoint> {
  const buckets = new Map<string, SeriesPoint>();
  const cursor = new Date(range.from);
  const end = new Date(range.to);
  while (cursor < end) {
    const key = bucketKey(cursor, range.granularity);
    if (!buckets.has(key)) {
      buckets.set(key, {
        label:
          range.granularity === "month"
            ? monthLabel.format(cursor)
            : dayLabel.format(cursor),
        revenue: 0,
        orders: 0,
      });
    }
    if (range.granularity === "month") {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return buckets;
}

/** Aggregate the entire analytics payload for a resolved date range. */
export async function getAnalytics(
  range: ResolvedRange,
): Promise<AnalyticsData> {
  const db = createAdminClient();

  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, grand_total, status, payment_status, payment_method, placed_at, customer_id, customer_name, customer_email",
    )
    .gte("placed_at", range.from)
    .lt("placed_at", range.to)
    .order("placed_at", { ascending: false });
  if (error) throw fromPostgrestError(error);

  // Time series + KPIs + breakdowns from orders.
  const buckets = buildBuckets(range);
  let revenue = 0;
  let paidOrders = 0;
  let unitsSold = 0;
  const customers = new Set<string>();
  const statusCounts = new Map<OrderStatus, number>();
  const paymentAgg = new Map<string, { count: number; amount: number }>();
  const customerAgg = new Map<
    string,
    {
      id: string | null;
      name: string;
      email: string;
      orders: number;
      spend: number;
    }
  >();

  for (const order of orders) {
    const placed = new Date(order.placed_at);
    const bucket = buckets.get(bucketKey(placed, range.granularity));
    if (bucket) {
      bucket.orders += 1;
      if (order.payment_status === "paid") bucket.revenue += order.grand_total;
    }

    if (order.payment_status === "paid") {
      revenue += order.grand_total;
      paidOrders += 1;
    }
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);

    const method = order.payment_method?.trim() || "other";
    const pay = paymentAgg.get(method) ?? { count: 0, amount: 0 };
    pay.count += 1;
    pay.amount += order.grand_total;
    paymentAgg.set(method, pay);

    const idKey =
      order.customer_id ??
      (order.customer_email
        ? `email:${order.customer_email.toLowerCase()}`
        : null);
    if (idKey) {
      customers.add(idKey);
      const existing = customerAgg.get(idKey) ?? {
        id: order.customer_id,
        name: order.customer_name?.trim() || "Guest",
        email: order.customer_email ?? "—",
        orders: 0,
        spend: 0,
      };
      existing.orders += 1;
      if (order.payment_status === "paid") existing.spend += order.grand_total;
      customerAgg.set(idKey, existing);
    }
  }

  // Line items → top products + categories + units sold.
  const orderIds = orders.map((order) => order.id);
  const productAgg = new Map<
    string,
    { title: string; productId: string | null; units: number; revenue: number }
  >();

  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await db
      .from("order_items")
      .select("product_id, product_title, quantity, subtotal")
      .in("order_id", orderIds);
    if (itemsError) throw fromPostgrestError(itemsError);

    for (const item of items) {
      unitsSold += item.quantity;
      const key = item.product_id ?? `title:${item.product_title}`;
      const entry = productAgg.get(key) ?? {
        title: item.product_title,
        productId: item.product_id,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += item.subtotal;
      productAgg.set(key, entry);
    }
  }

  // Resolve categories for products that sold.
  const categoryAgg = new Map<string, { revenue: number; units: number }>();
  const soldProductIds = [...productAgg.values()]
    .map((p) => p.productId)
    .filter((id): id is string => Boolean(id));
  if (soldProductIds.length > 0) {
    const { data: products, error: productsError } = await db
      .from("products")
      .select("id, category_id")
      .in("id", soldProductIds);
    if (productsError) throw fromPostgrestError(productsError);

    const categoryIds = [
      ...new Set(
        products
          .map((p) => p.category_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const categoryNames = new Map<string, string>();
    if (categoryIds.length > 0) {
      const { data: categories, error: categoriesError } = await db
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);
      if (categoriesError) throw fromPostgrestError(categoriesError);
      for (const category of categories) {
        categoryNames.set(category.id, category.name);
      }
    }

    const productCategory = new Map<string, string>();
    for (const product of products) {
      productCategory.set(
        product.id,
        product.category_id
          ? (categoryNames.get(product.category_id) ?? "Uncategorized")
          : "Uncategorized",
      );
    }

    for (const entry of productAgg.values()) {
      const name = entry.productId
        ? (productCategory.get(entry.productId) ?? "Uncategorized")
        : "Uncategorized";
      const cat = categoryAgg.get(name) ?? { revenue: 0, units: 0 };
      cat.revenue += entry.revenue;
      cat.units += entry.units;
      categoryAgg.set(name, cat);
    }
  }

  const topProducts: TopProduct[] = [...productAgg.entries()]
    .map(([key, value]) => ({
      key,
      title: value.title,
      units: value.units,
      revenue: value.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const topCategories: TopCategory[] = [...categoryAgg.entries()]
    .map(([name, value]) => ({
      name,
      revenue: value.revenue,
      units: value.units,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const bestCustomers: BestCustomer[] = [...customerAgg.values()]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      orders: c.orders,
      spend: c.spend,
    }));

  const paymentBreakdown: Breakdown[] = [...paymentAgg.entries()]
    .map(([label, value]) => ({
      label: label === "other" ? "Other" : label.toUpperCase(),
      count: value.count,
      amount: value.amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    range,
    kpis: {
      revenue,
      orders: orders.length,
      customers: customers.size,
      averageOrderValue: paidOrders > 0 ? Math.round(revenue / paidOrders) : 0,
      paidOrders,
      unitsSold,
    },
    series: [...buckets.values()],
    topProducts,
    topCategories,
    recentSales: orders.slice(0, 7).map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customer: order.customer_name?.trim() || order.customer_email || "Guest",
      total: order.grand_total,
      paymentStatus: order.payment_status,
      placedAt: order.placed_at,
    })),
    bestCustomers,
    statusBreakdown: ORDER_STATUSES.map((status) => ({
      status,
      count: statusCounts.get(status) ?? 0,
    })),
    paymentBreakdown,
  };
}
