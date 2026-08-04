import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type AccountOrder } from "./types";

/**
 * A customer's own order history, newest first. Orders are staff-RLS-only, so
 * this reads through the trusted service-role client after the caller has been
 * authenticated as the owning customer. Matched via the normalized CRM record.
 */
export async function listCustomerOrders(
  email: string,
): Promise<AccountOrder[]> {
  const db = createAdminClient();
  const normalizedEmail = email.toLowerCase();

  const { data: customer, error: customerError } = await db
    .from("customers")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (customerError) throw fromPostgrestError(customerError);
  if (!customer) return [];

  const { data: orders, error } = await db
    .from("orders")
    .select(
      "id, order_number, placed_at, status, payment_status, fulfillment_status, grand_total",
    )
    .eq("customer_id", customer.id)
    .order("placed_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  if (orders.length === 0) return [];

  const { data: items, error: itemsError } = await db
    .from("order_items")
    .select("order_id, quantity")
    .in(
      "order_id",
      orders.map((order) => order.id),
    );
  if (itemsError) throw fromPostgrestError(itemsError);

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.order_id, (counts.get(item.order_id) ?? 0) + item.quantity);
  }

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    placedAt: order.placed_at,
    status: order.status,
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    grandTotal: order.grand_total,
    itemCount: counts.get(order.id) ?? 0,
  }));
}
