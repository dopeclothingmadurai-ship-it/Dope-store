import "server-only";

import { storeInfo } from "@/lib/email/config";
import { formatPaise } from "@/lib/money";

export type OrderConfirmationItem = {
  title: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number; // paise
};

export type OrderConfirmationData = {
  orderNumber: string;
  customerName: string | null;
  orderDate: string; // preformatted, e.g. "6 Aug 2026"
  items: OrderConfirmationItem[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentStatus: string;
  fulfillmentType: "delivery" | "pickup";
  shippingAddress: string | null; // preformatted multi-line (delivery only)
};

// Luxury palette (inline — email clients ignore <style>/classes).
const C = {
  bg: "#0a0a0b",
  panel: "#131315",
  border: "#26262a",
  text: "#f4f3f1",
  muted: "#8f8d88",
  gold: "#c2a468",
} as const;

const cap = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

function itemRows(items: OrderConfirmationItem[]): string {
  return items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${C.border};color:${C.text};font-size:14px;">
          ${escapeHtml(item.title)}
          ${item.variantLabel ? `<span style="color:${C.muted};"> · ${escapeHtml(item.variantLabel)}</span>` : ""}
          <span style="color:${C.muted};"> × ${item.quantity}</span>
        </td>
        <td align="right" style="padding:14px 0;border-bottom:1px solid ${C.border};color:${C.text};font-size:14px;white-space:nowrap;">
          ${formatPaise(item.unitPrice * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");
}

function totalRow(label: string, value: string, strong = false): string {
  const color = strong ? C.text : C.muted;
  const weight = strong ? "600" : "400";
  const size = strong ? "16px" : "13px";
  return `
    <tr>
      <td style="padding:5px 0;color:${color};font-size:${size};font-weight:${weight};">${label}</td>
      <td align="right" style="padding:5px 0;color:${color};font-size:${size};font-weight:${weight};white-space:nowrap;">${value}</td>
    </tr>`;
}

function fulfillmentBlock(data: OrderConfirmationData): string {
  if (data.fulfillmentType === "pickup") {
    return panel(
      "Pick up at the nearest Dope Store",
      `<p style="margin:0;color:${C.muted};font-size:13px;line-height:1.7;">${escapeHtml(storeInfo.pickupInstructions)}</p>`,
    );
  }
  return panel(
    "Shipping address",
    `<p style="margin:0;color:${C.text};font-size:14px;line-height:1.7;white-space:pre-line;">${escapeHtml(
      data.shippingAddress ?? "—",
    )}</p>`,
  );
}

function panel(title: string, inner: string): string {
  return `
    <div style="margin-top:16px;padding:18px 20px;background:${C.panel};border:1px solid ${C.border};border-radius:8px;">
      <p style="margin:0 0 10px;color:${C.gold};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">${title}</p>
      ${inner}
    </div>`;
}

/** Build the full premium HTML for the order confirmation email. */
export function renderOrderConfirmation(data: OrderConfirmationData): string {
  const greeting = data.customerName
    ? `Thank you, ${escapeHtml(data.customerName.split(" ")[0] ?? data.customerName)}`
    : "Thank you";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="dark" />
<title>Order ${escapeHtml(data.orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
        <!-- Wordmark -->
        <tr>
          <td align="center" style="padding:8px 0 28px;">
            <span style="font-family:Georgia,'Times New Roman',serif;color:${C.text};font-size:30px;letter-spacing:0.34em;font-weight:600;">DOPE</span>
          </td>
        </tr>
        <!-- Hero -->
        <tr>
          <td style="padding:28px 28px 8px;background:${C.panel};border:1px solid ${C.border};border-radius:12px 12px 0 0;">
            <p style="margin:0 0 8px;color:${C.gold};font-size:11px;letter-spacing:0.26em;text-transform:uppercase;">Order confirmed</p>
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;color:${C.text};font-size:26px;font-weight:500;line-height:1.2;">${greeting}.</h1>
            <p style="margin:12px 0 0;color:${C.muted};font-size:14px;line-height:1.6;">
              We’ve received your order and our team is on it. Here are the details.
            </p>
          </td>
        </tr>
        <!-- Meta -->
        <tr>
          <td style="padding:20px 28px 4px;background:${C.panel};border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:${C.muted};font-size:12px;padding:3px 0;">Order number</td>
                <td align="right" style="color:${C.text};font-size:13px;font-weight:600;padding:3px 0;">${escapeHtml(data.orderNumber)}</td>
              </tr>
              <tr>
                <td style="color:${C.muted};font-size:12px;padding:3px 0;">Order date</td>
                <td align="right" style="color:${C.text};font-size:13px;padding:3px 0;">${escapeHtml(data.orderDate)}</td>
              </tr>
              <tr>
                <td style="color:${C.muted};font-size:12px;padding:3px 0;">Payment</td>
                <td align="right" style="color:${C.text};font-size:13px;padding:3px 0;">${escapeHtml(cap(data.paymentStatus))}</td>
              </tr>
              <tr>
                <td style="color:${C.muted};font-size:12px;padding:3px 0;">Fulfillment</td>
                <td align="right" style="color:${C.text};font-size:13px;padding:3px 0;">${
                  data.fulfillmentType === "pickup"
                    ? "Store pickup"
                    : "Home delivery"
                }</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Items -->
        <tr>
          <td style="padding:8px 28px 4px;background:${C.panel};border-left:1px solid ${C.border};border-right:1px solid ${C.border};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemRows(data.items)}
            </table>
          </td>
        </tr>
        <!-- Totals -->
        <tr>
          <td style="padding:14px 28px 22px;background:${C.panel};border-left:1px solid ${C.border};border-right:1px solid ${C.border};border-bottom:1px solid ${C.border};border-radius:0 0 12px 12px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${totalRow("Subtotal", formatPaise(data.subtotal))}
              ${data.discountTotal > 0 ? totalRow("Discount", `– ${formatPaise(data.discountTotal)}`) : ""}
              ${data.fulfillmentType === "delivery" ? totalRow("Shipping", data.shippingTotal > 0 ? formatPaise(data.shippingTotal) : "Free") : ""}
              ${data.taxTotal > 0 ? totalRow("Tax", formatPaise(data.taxTotal)) : ""}
              <tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid ${C.border};"></div></td></tr>
              ${totalRow("Total", formatPaise(data.grandTotal), true)}
            </table>
          </td>
        </tr>
        <!-- Fulfillment details -->
        <tr>
          <td style="padding:0 0 8px;">${fulfillmentBlock(data)}</td>
        </tr>
        <!-- Support -->
        <tr>
          <td style="padding:24px 4px 8px;">
            <p style="margin:0;color:${C.muted};font-size:13px;line-height:1.7;">
              Questions about your order? Reply to this email or write to us at
              <a href="mailto:${storeInfo.supportEmail}" style="color:${C.gold};text-decoration:none;">${storeInfo.supportEmail}</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 4px 8px;border-top:1px solid ${C.border};margin-top:16px;">
            <p style="margin:0 0 4px;color:${C.muted};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">${escapeHtml(storeInfo.name)} · Made in India</p>
            <p style="margin:0;color:${C.muted};font-size:11px;">© ${new Date().getFullYear()} ${escapeHtml(storeInfo.name)}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Minimal HTML escaping for interpolated user/order values. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
