import "server-only";

import { AppError } from "@/lib/errors";

import { isRazorpayConfigured, razorpayConfig } from "./config";

const ORDERS_ENDPOINT = "https://api.razorpay.com/v1/orders";

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

/** Thrown when payment is attempted before Razorpay keys are configured. */
export class PaymentUnavailableError extends AppError {
  constructor() {
    super(
      "payment_unavailable",
      "Online payment isn't available yet. Please try again later.",
    );
    this.name = "PaymentUnavailableError";
  }
}

/**
 * Create a Razorpay order via the REST API (no SDK dependency). `amount` is in
 * paise. Throws {@link PaymentUnavailableError} when unconfigured so the caller
 * can surface a friendly message instead of crashing.
 */
export async function createRazorpayOrder(params: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  if (
    !isRazorpayConfigured ||
    !razorpayConfig.keyId ||
    !razorpayConfig.keySecret
  ) {
    throw new PaymentUnavailableError();
  }

  const auth = Buffer.from(
    `${razorpayConfig.keyId}:${razorpayConfig.keySecret}`,
  ).toString("base64");

  const response = await fetch(ORDERS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes ?? {},
      payment_capture: 1,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(
      `[razorpay] order create failed ${response.status}: ${detail}`,
    );
    throw new AppError(
      "payment_error",
      "We couldn't start the payment. Please try again.",
    );
  }

  const data = (await response.json()) as {
    id: string;
    amount: number;
    currency: string;
  };
  return { id: data.id, amount: data.amount, currency: data.currency };
}
