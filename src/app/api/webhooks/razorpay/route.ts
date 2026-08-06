import { type NextRequest } from "next/server";

import { createOrderFromSnapshot } from "@/features/checkout/service";
import { verifyWebhookSignature } from "@/lib/razorpay/verify";

// Node runtime for crypto; must read the raw body for signature verification.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the backstop that creates the order server-side even if
 * the client never returns from the payment widget. Order creation is
 * idempotent (unique razorpay_order_id), so this and the verify action are safe
 * to both run.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response("invalid signature", { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment.id) {
      try {
        await createOrderFromSnapshot(payment.order_id, payment.id);
      } catch (error) {
        // Log and 200 anyway so Razorpay doesn't hammer retries for a bad row;
        // the verify action / a manual retry can still recover.
        console.error("[razorpay-webhook] order creation failed:", error);
      }
    }
  }

  return new Response("ok", { status: 200 });
}
