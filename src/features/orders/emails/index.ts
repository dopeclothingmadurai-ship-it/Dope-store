import "server-only";

import { sendEmail } from "@/lib/email/send";

import { type OrderAddress, type OrderDetail } from "../types";
import {
  type OrderConfirmationData,
  renderOrderConfirmation,
} from "./order-confirmation";

function formatAddress(address: OrderAddress | null): string | null {
  if (!address) return null;
  const lines = [
    address.name,
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
    address.phone,
  ].filter((line): line is string => Boolean(line && line.trim()));
  return lines.length > 0 ? lines.join("\n") : null;
}

function toConfirmationData(order: OrderDetail): OrderConfirmationData {
  const fulfillmentType =
    order.fulfillment_type === "pickup" ? "pickup" : "delivery";
  return {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    orderDate: new Date(order.placed_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    items: order.items.map((item) => ({
      title: item.product_title,
      variantLabel: item.variant_label,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    subtotal: order.subtotal,
    discountTotal: order.discount_total,
    shippingTotal: order.shipping_total,
    taxTotal: order.tax_total,
    grandTotal: order.grand_total,
    paymentStatus: order.payment_status,
    fulfillmentType,
    shippingAddress:
      fulfillmentType === "delivery"
        ? formatAddress(order.shipping_address as OrderAddress | null)
        : null,
  };
}

/**
 * Send the single automated transactional email — the order confirmation —
 * immediately after an order is created. Resilient: requires a customer email,
 * never throws, and returns a boolean the caller can log. It must never block
 * order creation or payment.
 */
export async function sendOrderConfirmationEmail(
  order: OrderDetail,
): Promise<boolean> {
  if (!order.customer_email) {
    return false;
  }

  const data = toConfirmationData(order);
  const result = await sendEmail({
    to: order.customer_email,
    subject: `Your Dope Store order ${order.order_number}`,
    html: renderOrderConfirmation(data),
  });

  if (!result.ok && !result.skipped) {
    console.error(
      `[order-confirmation] send failed for ${order.order_number}: ${result.error}`,
    );
  }
  return result.ok;
}

export { renderOrderConfirmation } from "./order-confirmation";
export type { OrderConfirmationData } from "./order-confirmation";
