"use client";

import Link from "next/link";
import { Check, Plus, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type OrderDetail } from "@/features/orders/types";
import { formatPaise } from "@/lib/money";

const stampFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function buildReceiptHtml(order: OrderDetail): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td>${item.product_title}${
          item.variant_label
            ? `<br/><span class="muted">${item.variant_label}</span>`
            : ""
        }</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatPaise(item.subtotal)}</td>
      </tr>`,
    )
    .join("");

  const line = (label: string, value: string, strong = false) =>
    `<div class="row ${strong ? "strong" : ""}"><span>${label}</span><span>${value}</span></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${order.order_number}</title>
  <style>
    * { font-family: ui-monospace, Menlo, Consolas, monospace; }
    body { width: 300px; margin: 0 auto; padding: 16px; color: #111; }
    h1 { font-size: 18px; text-align: center; margin: 0 0 2px; letter-spacing: 2px; }
    .center { text-align: center; }
    .muted { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
    th, td { text-align: left; padding: 3px 0; vertical-align: top; }
    .num { text-align: right; white-space: nowrap; }
    thead th { border-bottom: 1px dashed #999; }
    hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
    .row.strong { font-weight: 700; font-size: 14px; border-top: 1px solid #111; padding-top: 6px; margin-top: 4px; }
  </style></head><body>
    <h1>DOPE STORE</h1>
    <p class="center muted">Point of Sale Receipt</p>
    <hr/>
    <p class="muted">Order: ${order.order_number}<br/>Date: ${stampFmt.format(new Date(order.placed_at))}${
      order.customer_name ? `<br/>Customer: ${order.customer_name}` : ""
    }</p>
    <table>
      <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${line("Subtotal", formatPaise(order.subtotal))}
    ${order.discount_total > 0 ? line("Discount", `- ${formatPaise(order.discount_total)}`) : ""}
    ${line("Tax", formatPaise(order.tax_total))}
    ${line("Shipping", formatPaise(order.shipping_total))}
    ${line("Total", formatPaise(order.grand_total), true)}
    <hr/>
    <p class="center muted">Paid via ${order.payment_method ?? "cash"}<br/>Thank you for shopping with us!</p>
  </body></html>`;
}

function printReceipt(order: OrderDetail) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  win.document.write(buildReceiptHtml(order));
  win.document.close();
  win.focus();
  win.print();
}

export function PosReceipt({
  order,
  onNewSale,
}: {
  order: OrderDetail;
  onNewSale: () => void;
}) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
          <Check className="size-7" />
        </span>
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold text-white">
            Sale complete
          </h2>
          <p className="text-muted-foreground text-sm">
            Order{" "}
            <Link
              href={`/admin/orders/${order.id}`}
              className="font-mono hover:underline"
            >
              {order.order_number}
            </Link>{" "}
            · {formatPaise(order.grand_total)}
          </p>
        </div>
      </div>

      <div className="bg-card space-y-3 rounded-2xl border p-5">
        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.product_title}</p>
                <p className="text-muted-foreground text-xs">
                  {item.quantity} × {formatPaise(item.unit_price)}
                  {item.variant_label ? ` · ${item.variant_label}` : ""}
                </p>
              </div>
              <span className="font-medium tabular-nums">
                {formatPaise(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-border space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPaise(order.subtotal)}</span>
          </div>
          {order.discount_total > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums">
                − {formatPaise(order.discount_total)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatPaise(order.tax_total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {formatPaise(order.shipping_total)}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-white">
            <span>Total</span>
            <span className="tabular-nums">
              {formatPaise(order.grand_total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => printReceipt(order)}
        >
          <Printer /> Print receipt
        </Button>
        <Button className="flex-1" onClick={onNewSale}>
          <Plus /> New sale
        </Button>
      </div>
    </div>
  );
}
