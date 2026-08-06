import "server-only";

import { validateCoupon } from "@/features/coupons/service";
import { sendOrderConfirmationEmail } from "@/features/orders/emails";
import { getOrderDetail } from "@/features/orders/queries";
import { type OrderDetail } from "@/features/orders/types";
import {
  InventoryError,
  ValidationError,
  fromPostgrestError,
} from "@/lib/errors";
import { createRazorpayOrder } from "@/lib/razorpay/client";
import { razorpayConfig } from "@/lib/razorpay/config";
import { verifyPaymentSignature } from "@/lib/razorpay/verify";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type CheckoutAddress,
  type CheckoutContact,
  type CheckoutValues,
} from "./schema";
import { computeShipping } from "./shipping";

/** Preview a coupon for the checkout UI (public). Returns the discount in paise. */
export async function previewCoupon(
  code: string,
  subtotal: number,
): Promise<{ code: string; discount: number }> {
  const validation = await validateCoupon(code, subtotal, null);
  return {
    code: validation.code,
    discount: Math.min(subtotal, validation.discount),
  };
}

type PricedLine = {
  product_id: string;
  variant_id: string;
  product_title: string;
  variant_label: string | null;
  sku: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

/** Re-price + stock-validate the cart from the database. Never trust the client. */
async function priceCart(
  items: CheckoutValues["items"],
): Promise<{ lines: PricedLine[]; subtotal: number }> {
  const db = createAdminClient();
  const variantIds = items.map((item) => item.variantId);
  const { data: variants, error } = await db
    .from("product_variants")
    .select(
      "id, sku, size, color, price_override, product_id, products(title, base_price, archived_at, status), inventory(quantity, reserved_quantity)",
    )
    .in("id", variantIds);
  if (error) throw fromPostgrestError(error);

  const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

  const lines: PricedLine[] = [];
  for (const item of items) {
    const variant = variantMap.get(item.variantId);
    if (
      !variant ||
      !variant.products ||
      variant.products.archived_at ||
      variant.products.status !== "active"
    ) {
      throw new ValidationError("One of the items is no longer available.");
    }
    const available =
      (variant.inventory?.quantity ?? 0) -
      (variant.inventory?.reserved_quantity ?? 0);
    if (item.quantity > available) {
      throw new InventoryError(
        available <= 0
          ? `${variant.products.title} went out of stock while you were checking out.`
          : `Only ${available} left in stock for ${variant.products.title}.`,
      );
    }
    const unitPrice = variant.price_override ?? variant.products.base_price;
    const label = [variant.color, variant.size].filter(Boolean).join(" / ");
    lines.push({
      product_id: variant.product_id,
      variant_id: variant.id,
      product_title: variant.products.title,
      variant_label: label || null,
      sku: variant.sku,
      unit_price: unitPrice,
      quantity: item.quantity,
      subtotal: unitPrice * item.quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  return { lines, subtotal };
}

/** Build the server-authoritative order payload (the create_online_order input). */
async function buildPayload(input: CheckoutValues) {
  const { lines, subtotal } = await priceCart(input.items);

  let couponId: string | null = null;
  let couponCode: string | null = null;
  let discountTotal = 0;
  if (input.couponCode) {
    const validation = await validateCoupon(
      input.couponCode,
      subtotal,
      input.contact.email,
    );
    couponId = validation.couponId;
    couponCode = validation.code;
    discountTotal = Math.min(subtotal, validation.discount);
  }

  const shippingTotal = computeShipping(subtotal, input.fulfillmentType);
  const taxTotal = 0;
  const grandTotal = subtotal - discountTotal + shippingTotal + taxTotal;

  const address: CheckoutAddress | null =
    input.fulfillmentType === "delivery" ? input.address : null;

  return {
    fulfillment_type: input.fulfillmentType,
    customer_name: input.contact.name,
    customer_email: input.contact.email,
    customer_phone: input.contact.phone,
    shipping_address: address
      ? {
          name: address.name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          country: "India",
          phone: input.contact.phone,
        }
      : null,
    subtotal,
    discount_total: discountTotal,
    tax_total: taxTotal,
    shipping_total: shippingTotal,
    grand_total: grandTotal,
    coupon_id: couponId,
    coupon_code: couponCode,
    items: lines,
  };
}

export type CheckoutOrderResult = {
  razorpayOrderId: string;
  amount: number;
  keyId: string;
  contact: CheckoutContact;
};

/**
 * Price the cart, create a Razorpay order for the server-computed total, and
 * stash the authoritative snapshot. The order itself is created only after the
 * payment is verified.
 */
export async function startCheckout(
  input: CheckoutValues,
): Promise<CheckoutOrderResult> {
  const payload = await buildPayload(input);

  const razorpayOrder = await createRazorpayOrder({
    amount: payload.grand_total,
    receipt: `dope_${Date.now()}`,
    notes: {
      email: payload.customer_email,
      fulfillment: payload.fulfillment_type,
    },
  });

  const db = createAdminClient();
  const { error } = await db.from("pending_checkouts").upsert({
    razorpay_order_id: razorpayOrder.id,
    payload,
    amount: payload.grand_total,
  });
  if (error) throw fromPostgrestError(error);

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: payload.grand_total,
    keyId: razorpayConfig.keyId ?? "",
    contact: input.contact,
  };
}

/**
 * Verify a payment and create the order (idempotent). Called by the client
 * verify action and, as a backstop, by the webhook. Sends the confirmation
 * email once the order exists.
 */
export async function finalizeCheckout(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}): Promise<OrderDetail> {
  if (
    !verifyPaymentSignature({
      orderId: params.razorpayOrderId,
      paymentId: params.razorpayPaymentId,
      signature: params.signature,
    })
  ) {
    throw new ValidationError("Payment could not be verified.");
  }
  return createOrderFromSnapshot(
    params.razorpayOrderId,
    params.razorpayPaymentId,
  );
}

/** Create the order from the stored snapshot (idempotent via the RPC + email). */
export async function createOrderFromSnapshot(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<OrderDetail> {
  const db = createAdminClient();

  const { data: pending, error: pendingError } = await db
    .from("pending_checkouts")
    .select("payload")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (pendingError) throw fromPostgrestError(pendingError);
  if (!pending) {
    throw new ValidationError("This checkout has expired. Please try again.");
  }

  const payload = {
    ...(pending.payload as Record<string, unknown>),
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
  };

  const { data: orderId, error: rpcError } = await db.rpc(
    "create_online_order",
    { p_payload: payload },
  );
  if (rpcError) throw fromPostgrestError(rpcError);

  const detail = await getOrderDetail(orderId);
  if (!detail) throw new ValidationError("The order could not be created.");

  // Single automated email — resilient, never blocks the order.
  try {
    await sendOrderConfirmationEmail(detail);
  } catch (emailError) {
    console.error("[checkout] confirmation email threw:", emailError);
  }

  return detail;
}
