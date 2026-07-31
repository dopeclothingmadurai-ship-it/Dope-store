import "server-only";

import { couponStatus } from "@/features/coupons/types";
import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { paiseToCsvAmount, toCsv } from "@/lib/csv";

export type ExportEntity = "products" | "orders" | "customers" | "coupons";

async function exportProducts(): Promise<string> {
  const db = createAdminClient();
  const [productsResult, categoriesResult] = await Promise.all([
    db
      .from("products")
      .select(
        "id, title, slug, status, brand, category_id, base_price, compare_at_price, featured, tags, created_at",
      )
      .order("created_at", { ascending: false }),
    db.from("categories").select("id, name"),
  ]);
  if (productsResult.error) throw fromPostgrestError(productsResult.error);
  if (categoriesResult.error) throw fromPostgrestError(categoriesResult.error);

  const categoryName = new Map(
    categoriesResult.data.map((category) => [category.id, category.name]),
  );

  return toCsv(
    [
      "Title",
      "Slug",
      "Status",
      "Brand",
      "Category",
      "Price",
      "Compare at",
      "Featured",
      "Tags",
      "Created",
    ],
    productsResult.data.map((product) => [
      product.title,
      product.slug,
      product.status,
      product.brand,
      product.category_id ? (categoryName.get(product.category_id) ?? "") : "",
      paiseToCsvAmount(product.base_price),
      paiseToCsvAmount(product.compare_at_price),
      product.featured ? "yes" : "no",
      (product.tags ?? []).join(" | "),
      product.created_at,
    ]),
  );
}

async function exportOrders(): Promise<string> {
  const db = createAdminClient();
  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, placed_at, customer_name, customer_email, channel, status, payment_status, fulfillment_status, payment_method, subtotal, discount_total, tax_total, shipping_total, grand_total",
    )
    .order("placed_at", { ascending: false });
  if (error) throw fromPostgrestError(error);

  const itemCounts = new Map<string, number>();
  const ids = orders.map((order) => order.id);
  if (ids.length > 0) {
    const { data: items, error: itemsError } = await db
      .from("order_items")
      .select("order_id, quantity")
      .in("order_id", ids);
    if (itemsError) throw fromPostgrestError(itemsError);
    for (const item of items) {
      itemCounts.set(
        item.order_id,
        (itemCounts.get(item.order_id) ?? 0) + item.quantity,
      );
    }
  }

  return toCsv(
    [
      "Order",
      "Date",
      "Customer",
      "Email",
      "Channel",
      "Status",
      "Payment",
      "Fulfillment",
      "Method",
      "Items",
      "Subtotal",
      "Discount",
      "Tax",
      "Shipping",
      "Total",
    ],
    orders.map((order) => [
      order.order_number,
      order.placed_at,
      order.customer_name,
      order.customer_email,
      order.channel,
      order.status,
      order.payment_status,
      order.fulfillment_status,
      order.payment_method,
      itemCounts.get(order.id) ?? 0,
      paiseToCsvAmount(order.subtotal),
      paiseToCsvAmount(order.discount_total),
      paiseToCsvAmount(order.tax_total),
      paiseToCsvAmount(order.shipping_total),
      paiseToCsvAmount(order.grand_total),
    ]),
  );
}

async function exportCustomers(): Promise<string> {
  const db = createAdminClient();
  const { data: customers, error } = await db
    .from("customers")
    .select("id, name, email, phone, created_at")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);

  const agg = new Map<
    string,
    { orders: number; spend: number; first: string | null; last: string | null }
  >();
  const ids = customers.map((customer) => customer.id);
  if (ids.length > 0) {
    const { data: orders, error: ordersError } = await db
      .from("orders")
      .select("customer_id, grand_total, payment_status, placed_at")
      .in("customer_id", ids);
    if (ordersError) throw fromPostgrestError(ordersError);
    for (const order of orders) {
      if (!order.customer_id) continue;
      const entry = agg.get(order.customer_id) ?? {
        orders: 0,
        spend: 0,
        first: null,
        last: null,
      };
      entry.orders += 1;
      if (order.payment_status === "paid") entry.spend += order.grand_total;
      if (!entry.first || order.placed_at < entry.first) {
        entry.first = order.placed_at;
      }
      if (!entry.last || order.placed_at > entry.last) {
        entry.last = order.placed_at;
      }
      agg.set(order.customer_id, entry);
    }
  }

  return toCsv(
    [
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total spend",
      "First order",
      "Last order",
      "Joined",
    ],
    customers.map((customer) => {
      const entry = agg.get(customer.id);
      return [
        customer.name,
        customer.email,
        customer.phone,
        entry?.orders ?? 0,
        paiseToCsvAmount(entry?.spend ?? 0),
        entry?.first ?? "",
        entry?.last ?? "",
        customer.created_at,
      ];
    }),
  );
}

async function exportCoupons(): Promise<string> {
  const db = createAdminClient();
  const { data: coupons, error } = await db
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);

  return toCsv(
    [
      "Code",
      "Type",
      "Value",
      "Min order",
      "Max discount",
      "Usage limit",
      "Per customer",
      "Times used",
      "Status",
      "Starts",
      "Ends",
      "Created",
    ],
    coupons.map((coupon) => [
      coupon.code,
      coupon.type,
      coupon.type === "percentage"
        ? `${coupon.value}%`
        : paiseToCsvAmount(coupon.value),
      paiseToCsvAmount(coupon.min_order),
      coupon.max_discount ? paiseToCsvAmount(coupon.max_discount) : "",
      coupon.usage_limit ?? "",
      coupon.per_customer_limit ?? "",
      coupon.times_used,
      couponStatus(coupon),
      coupon.starts_at ?? "",
      coupon.ends_at ?? "",
      coupon.created_at,
    ]),
  );
}

/** Serialize an entity's full table to a CSV string. */
export async function exportCsv(entity: ExportEntity): Promise<string> {
  switch (entity) {
    case "products":
      return exportProducts();
    case "orders":
      return exportOrders();
    case "customers":
      return exportCustomers();
    case "coupons":
      return exportCoupons();
  }
}
