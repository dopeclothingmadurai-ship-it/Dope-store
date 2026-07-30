import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type FulfillmentStatus,
  type Order,
  type OrderEvent,
  type OrderStatus,
  type PaymentStatus,
} from "./types";

type Db = ReturnType<typeof createAdminClient>;

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  failed: "Failed",
};

const FULFILLMENT_STATUS_LABEL: Record<FulfillmentStatus, string> = {
  unfulfilled: "Unfulfilled",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Append a timeline event. Every status change records one. */
async function recordEvent(
  db: Db,
  orderId: string,
  kind: string,
  message: string,
): Promise<void> {
  const { error } = await db
    .from("order_events")
    .insert({ order_id: orderId, kind, message });
  if (error) throw fromPostgrestError(error);
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  await recordEvent(
    db,
    id,
    "status",
    `Order status set to ${ORDER_STATUS_LABEL[status]}`,
  );
  return data;
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
): Promise<Order> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  await recordEvent(
    db,
    id,
    "payment",
    `Payment status set to ${PAYMENT_STATUS_LABEL[paymentStatus]}`,
  );
  return data;
}

export async function updateFulfillmentStatus(
  id: string,
  fulfillmentStatus: FulfillmentStatus,
): Promise<Order> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  await recordEvent(
    db,
    id,
    "fulfillment",
    `Fulfillment set to ${FULFILLMENT_STATUS_LABEL[fulfillmentStatus]}`,
  );
  return data;
}

export async function updateStaffNote(
  id: string,
  note: string | null,
): Promise<Order> {
  const db = createAdminClient();
  const trimmed = note?.trim() ? note.trim() : null;
  const { data, error } = await db
    .from("orders")
    .update({ staff_note: trimmed })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function addOrderNote(
  id: string,
  message: string,
): Promise<OrderEvent> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("order_events")
    .insert({ order_id: id, kind: "note", message })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}
