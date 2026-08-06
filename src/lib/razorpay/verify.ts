import "server-only";

import crypto from "node:crypto";

import { razorpayConfig } from "./config";

/** Constant-time string comparison (both hex strings). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify a Razorpay Checkout callback signature:
 *   HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret).
 * Returns false when the secret is missing — an order is created only on true.
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!razorpayConfig.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", razorpayConfig.keySecret)
    .update(`${params.orderId}|${params.paymentId}`)
    .digest("hex");
  return safeEqual(expected, params.signature);
}

/**
 * Verify a Razorpay webhook signature over the raw request body:
 *   HMAC_SHA256(rawBody, webhook_secret).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!razorpayConfig.webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", razorpayConfig.webhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
}
