import { type NextRequest } from "next/server";

import {
  type OrderConfirmationData,
  renderOrderConfirmation,
} from "@/features/orders/emails";

/**
 * Dev-only preview of the order confirmation email. Hard-disabled in
 * production (returns 404). Visit /api/dev/email-preview?type=pickup to see the
 * pickup variant. Uses representative sample data — sends nothing.
 */
export const dynamic = "force-dynamic";

const SAMPLE_ITEMS = [
  {
    title: "Oxford Plain Shirt",
    variantLabel: "White / M",
    quantity: 1,
    unitPrice: 94900,
  },
  {
    title: "Baggy Pant",
    variantLabel: "Charcoal / 32",
    quantity: 2,
    unitPrice: 129900,
  },
];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const pickup = request.nextUrl.searchParams.get("type") === "pickup";
  const subtotal = SAMPLE_ITEMS.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  const data: OrderConfirmationData = {
    orderNumber: "DS-2026-00042",
    customerName: "Aarav Mehta",
    orderDate: "6 Aug 2026",
    items: SAMPLE_ITEMS,
    subtotal,
    discountTotal: 20000,
    shippingTotal: pickup ? 0 : 0,
    taxTotal: 0,
    grandTotal: subtotal - 20000,
    paymentStatus: "paid",
    fulfillmentType: pickup ? "pickup" : "delivery",
    shippingAddress: pickup
      ? null
      : "Aarav Mehta\n12 Residency Road\nBengaluru, Karnataka, 560025\nIndia\n+91 98765 43210",
  };

  return new Response(renderOrderConfirmation(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
