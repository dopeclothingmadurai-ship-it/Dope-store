import "server-only";

import { validateCoupon } from "@/features/coupons/service";
import { getOrderDetail } from "@/features/orders/queries";
import { type OrderDetail } from "@/features/orders/types";
import {
  InventoryError,
  ValidationError,
  fromPostgrestError,
} from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type PosOrderValues } from "./schema";

type LineItem = {
  product_id: string;
  variant_id: string;
  product_title: string;
  variant_label: string | null;
  sku: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

/**
 * Create an offline (POS) order. Every amount is recomputed server-side from
 * the database — the client's prices are never trusted. The actual write is a
 * single transactional RPC that also reduces stock and records the timeline.
 */
export async function createPosOrder(
  input: PosOrderValues,
): Promise<OrderDetail> {
  const db = createAdminClient();

  // Load authoritative variant + product + stock for each line.
  const variantIds = input.items.map((item) => item.variantId);
  const { data: variants, error } = await db
    .from("product_variants")
    .select(
      "id, sku, size, color, price_override, product_id, products(title, base_price, archived_at), inventory(quantity, reserved_quantity)",
    )
    .in("id", variantIds);
  if (error) throw fromPostgrestError(error);

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const lines: LineItem[] = [];
  for (const item of input.items) {
    const variant = variantMap.get(item.variantId);
    if (!variant || !variant.products || variant.products.archived_at) {
      throw new ValidationError("One of the items is no longer available.");
    }
    const available =
      (variant.inventory?.quantity ?? 0) -
      (variant.inventory?.reserved_quantity ?? 0);
    if (item.quantity > available) {
      throw new InventoryError(
        `Only ${available} in stock for ${variant.products.title}.`,
      );
    }
    const unitPrice = variant.price_override ?? variant.products.base_price;
    const parts = [variant.color, variant.size].filter(Boolean);
    lines.push({
      product_id: variant.product_id,
      variant_id: variant.id,
      product_title: variant.products.title,
      variant_label: parts.length > 0 ? parts.join(" / ") : null,
      sku: variant.sku,
      unit_price: unitPrice,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);

  // Coupon (validated + priced server-side).
  let couponId: string | null = null;
  let couponCode: string | null = null;
  let couponDiscount = 0;
  if (input.couponCode?.trim()) {
    const validation = await validateCoupon(
      input.couponCode,
      subtotal,
      input.customer?.email ?? null,
    );
    couponId = validation.couponId;
    couponCode = validation.code;
    couponDiscount = validation.discount;
  }

  const discountTotal = Math.min(
    subtotal,
    couponDiscount + input.manualDiscount,
  );
  const grandTotal = subtotal - discountTotal + input.tax + input.shipping;

  const payload = {
    customer_name: input.customer?.name ?? null,
    customer_email: input.customer?.email ?? null,
    customer_phone: input.customer?.phone ?? null,
    payment_method: input.paymentMethod,
    subtotal,
    discount_total: discountTotal,
    tax_total: input.tax,
    shipping_total: input.shipping,
    grand_total: grandTotal,
    coupon_id: couponId,
    coupon_code: couponCode,
    note: input.note ?? null,
    items: lines,
  };

  const { data: orderId, error: rpcError } = await db.rpc("create_pos_order", {
    p_payload: payload,
  });
  if (rpcError) throw fromPostgrestError(rpcError);

  const detail = await getOrderDetail(orderId);
  if (!detail) {
    throw new ValidationError("The order could not be created.");
  }
  return detail;
}
