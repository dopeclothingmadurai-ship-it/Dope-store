"use server";

import { z } from "zod";

import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";

import { checkoutSchema } from "./schema";
import {
  type CheckoutOrderResult,
  finalizeCheckout,
  previewCoupon,
  startCheckout,
} from "./service";

const couponPreviewSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.coerce.number().int().min(0),
});

/** Validate a coupon against a subtotal for the checkout UI (public preview). */
export async function previewCouponAction(
  input: unknown,
): Promise<Result<{ code: string; discount: number }>> {
  return runAction(async () => {
    const { code, subtotal } = couponPreviewSchema.parse(input);
    return previewCoupon(code, subtotal);
  });
}

/**
 * Step 1 of checkout: validate + server-price the cart and create a Razorpay
 * order for the exact server-computed amount. Returns what the client needs to
 * open the Razorpay widget. No order exists yet.
 */
export async function startCheckoutAction(
  input: unknown,
): Promise<Result<CheckoutOrderResult>> {
  return runAction(async () => {
    const values = checkoutSchema.parse(input);
    return startCheckout(values);
  });
}

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  signature: z.string().min(1),
});

/**
 * Step 2: verify the payment signature and create the order (idempotent). The
 * confirmation email is sent inside finalizeCheckout.
 */
export async function verifyCheckoutPaymentAction(
  input: unknown,
): Promise<Result<{ orderNumber: string; orderId: string }>> {
  return runAction(async () => {
    const { razorpayOrderId, razorpayPaymentId, signature } =
      verifySchema.parse(input);
    const order = await finalizeCheckout({
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    });
    // orderId (uuid) is unguessable — used to load the confirmation securely.
    return { orderNumber: order.order_number, orderId: order.id };
  });
}
