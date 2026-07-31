import "server-only";

import { couponStatus } from "@/features/coupons/types";
import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type SearchResults } from "./types";

const PER_GROUP = 5;

/** Cross-entity search for the command palette. Five hits per group. */
export async function globalSearch(term: string): Promise<SearchResults> {
  const query = term.trim();
  const empty: SearchResults = {
    products: [],
    orders: [],
    customers: [],
    coupons: [],
  };
  if (query.length < 1) return empty;

  const db = createAdminClient();
  const escaped = query.replace(/[%,]/g, "");

  const [products, orders, customers, coupons] = await Promise.all([
    db
      .from("products")
      .select("id, title, status")
      .or(`title.ilike.%${escaped}%,slug.ilike.%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
    db
      .from("orders")
      .select("id, order_number, customer_name, grand_total")
      .or(
        `order_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,customer_email.ilike.%${escaped}%`,
      )
      .order("placed_at", { ascending: false })
      .limit(PER_GROUP),
    db
      .from("customers")
      .select("id, name, email, phone")
      .or(
        `name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
      )
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
    db
      .from("coupons")
      .select("*")
      .ilike("code", `%${escaped}%`)
      .order("created_at", { ascending: false })
      .limit(PER_GROUP),
  ]);

  if (products.error) throw fromPostgrestError(products.error);
  if (orders.error) throw fromPostgrestError(orders.error);
  if (customers.error) throw fromPostgrestError(customers.error);
  if (coupons.error) throw fromPostgrestError(coupons.error);

  return {
    products: products.data.map((product) => ({
      id: product.id,
      kind: "product" as const,
      title: product.title,
      subtitle: product.status,
      href: `/admin/catalog/products/${product.id}`,
    })),
    orders: orders.data.map((order) => ({
      id: order.id,
      kind: "order" as const,
      title: order.order_number,
      subtitle: order.customer_name,
      href: `/admin/orders/${order.id}`,
    })),
    customers: customers.data.map((customer) => ({
      id: customer.id,
      kind: "customer" as const,
      title: customer.name ?? customer.email ?? "Guest",
      subtitle: customer.email ?? customer.phone,
      href: `/admin/customers/${customer.id}`,
    })),
    coupons: coupons.data.map((coupon) => ({
      id: coupon.id,
      kind: "coupon" as const,
      title: coupon.code,
      subtitle: couponStatus(coupon),
      href: `/admin/coupons?q=${encodeURIComponent(coupon.code)}`,
    })),
  };
}
