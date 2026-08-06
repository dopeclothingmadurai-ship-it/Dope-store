import "server-only";

import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";

/**
 * Razorpay configuration, resolved from environment variables (never
 * hard-coded). Mirrors the email layer: when keys are absent the payment code
 * degrades gracefully instead of crashing.
 *
 * Required environment variables (add to `.env.local`, then it just works):
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID  Public key id (used by the checkout widget).
 *   RAZORPAY_KEY_SECRET          Server secret (order + signature verify).
 *   RAZORPAY_WEBHOOK_SECRET      Webhook signing secret.
 */
export const razorpayConfig = {
  keyId: clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? null,
  keySecret: serverEnv.RAZORPAY_KEY_SECRET ?? null,
  webhookSecret: serverEnv.RAZORPAY_WEBHOOK_SECRET ?? null,
} as const;

/** True only when the checkout can create + verify payments. */
export const isRazorpayConfigured = Boolean(
  razorpayConfig.keyId && razorpayConfig.keySecret,
);
