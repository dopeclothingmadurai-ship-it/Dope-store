"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Ticket,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PriceInput } from "@/components/admin/price-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type OrderDetail } from "@/features/orders/types";
import { validateCouponAction } from "@/features/coupons/actions";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import {
  createPosOrderAction,
  searchPosCustomersAction,
  searchPosItemsAction,
} from "../actions";
import { type PosCustomer, type PosSearchItem } from "../types";
import { PosReceipt } from "./pos-receipt";

type CartLine = { item: PosSearchItem; quantity: number };

type PaymentMethod = "cash" | "upi" | "card";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

export function PosTerminal() {
  // Catalog search
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<PosSearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartLine[]>([]);

  // Customer
  const [customerTerm, setCustomerTerm] = useState("");
  const [customerResults, setCustomerResults] = useState<PosCustomer[]>([]);
  const [customer, setCustomer] = useState<PosCustomer>({
    id: null,
    name: null,
    email: null,
    phone: null,
  });

  // Coupon + charges
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [manualDiscount, setManualDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<OrderDetail | null>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Debounced catalog search.
  useEffect(() => {
    const query = term.trim();
    if (!query) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const res = await searchPosItemsAction({ term: query });
      if (res.ok) setResults(res.data);
      setSearching(false);
    }, 250);
    return () => clearTimeout(handle);
  }, [term]);

  // Debounced customer search.
  useEffect(() => {
    const query = customerTerm.trim();
    if (!query) {
      setCustomerResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await searchPosCustomersAction({ term: query });
      if (res.ok) setCustomerResults(res.data);
    }, 250);
    return () => clearTimeout(handle);
  }, [customerTerm]);

  const subtotal = cart.reduce(
    (sum, line) => sum + line.item.unitPrice * line.quantity,
    0,
  );
  const discountTotal = Math.min(
    subtotal,
    (couponPreview?.discount ?? 0) + manualDiscount,
  );
  const grandTotal = subtotal - discountTotal + tax + shipping;

  function addItem(item: PosSearchItem) {
    if (item.available <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (line) => line.item.variantId === item.variantId,
      );
      if (existing) {
        if (existing.quantity >= item.available) {
          toast.error("No more stock available");
          return prev;
        }
        return prev.map((line) =>
          line.item.variantId === item.variantId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    setTerm("");
    setResults([]);
    searchRef.current?.focus();
  }

  function setQuantity(variantId: string, quantity: number) {
    setCart((prev) =>
      prev.flatMap((line) => {
        if (line.item.variantId !== variantId) return [line];
        if (quantity <= 0) return [];
        const capped = Math.min(quantity, line.item.available);
        return [{ ...line, quantity: capped }];
      }),
    );
  }

  function removeLine(variantId: string) {
    setCart((prev) => prev.filter((line) => line.item.variantId !== variantId));
  }

  async function applyCoupon() {
    const code = couponCode.trim();
    if (!code) return;
    if (subtotal <= 0) {
      toast.error("Add items before applying a coupon");
      return;
    }
    setApplyingCoupon(true);
    const res = await validateCouponAction({
      code,
      subtotal,
      customerEmail: customer.email,
    });
    setApplyingCoupon(false);
    if (!res.ok) {
      setCouponPreview(null);
      toast.error(res.error.message);
      return;
    }
    setCouponPreview({ code: res.data.code, discount: res.data.discount });
    toast.success(`Applied ${res.data.code}`);
  }

  function clearCoupon() {
    setCouponPreview(null);
    setCouponCode("");
  }

  function selectCustomer(next: PosCustomer) {
    setCustomer(next);
    setCustomerTerm("");
    setCustomerResults([]);
  }

  function resetSale() {
    setCart([]);
    setCustomer({ id: null, name: null, email: null, phone: null });
    setCustomerTerm("");
    clearCoupon();
    setManualDiscount(0);
    setTax(0);
    setShipping(0);
    setPayment("cash");
    setNote("");
    setCompleted(null);
    searchRef.current?.focus();
  }

  async function checkout() {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSubmitting(true);
    const hasCustomer =
      customer.id || customer.name || customer.email || customer.phone;
    const res = await createPosOrderAction({
      items: cart.map((line) => ({
        variantId: line.item.variantId,
        quantity: line.quantity,
      })),
      customer: hasCustomer
        ? {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          }
        : null,
      couponCode: couponPreview?.code ?? null,
      manualDiscount,
      tax,
      shipping,
      paymentMethod: payment,
      note: note.trim() ? note : null,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Sale recorded");
    setCompleted(res.data);
  }

  if (completed) {
    return <PosReceipt order={completed} onNewSale={resetSale} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left: search + cart */}
      <div className="space-y-4 lg:col-span-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={searchRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                event.preventDefault();
                addItem(results[0]);
              }
            }}
            placeholder="Search products or scan SKU…"
            className="h-11 rounded-xl pl-9"
          />
          {searching ? (
            <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
          ) : null}

          {results.length > 0 ? (
            <div className="bg-popover absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border p-1 shadow-xl">
              {results.map((item) => (
                <button
                  key={item.variantId}
                  type="button"
                  onClick={() => addItem(item)}
                  disabled={item.available <= 0}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.productTitle}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {item.sku}
                      {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatPaise(item.unitPrice)}
                    </p>
                    <p
                      className={cn(
                        "text-xs tabular-nums",
                        item.available <= 0
                          ? "text-red-400"
                          : "text-muted-foreground",
                      )}
                    >
                      {item.available} in stock
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Cart */}
        <div className="bg-card rounded-2xl border">
          {cart.length === 0 ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 py-16 text-center text-sm">
              <ShoppingCart className="size-6 opacity-60" />
              Search to add products to the sale.
            </div>
          ) : (
            <ul className="divide-border/60 divide-y">
              {cart.map((line) => (
                <li
                  key={line.item.variantId}
                  className="flex items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {line.item.productTitle}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-xs">
                      {line.item.sku}
                      {line.item.variantLabel
                        ? ` · ${line.item.variantLabel}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(line.item.variantId, line.quantity - 1)
                      }
                    >
                      <Minus />
                    </Button>
                    <span className="w-8 text-center text-sm tabular-nums">
                      {line.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() =>
                        setQuantity(line.item.variantId, line.quantity + 1)
                      }
                    >
                      <Plus />
                    </Button>
                  </div>
                  <div className="w-20 text-right text-sm font-medium tabular-nums">
                    {formatPaise(line.item.unitPrice * line.quantity)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(line.item.variantId)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right: customer + charges + checkout */}
      <div className="space-y-4 lg:col-span-2">
        {/* Customer */}
        <div className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <UserRound className="text-muted-foreground size-4" />
            <h2 className="text-sm font-semibold text-white">Customer</h2>
            {customer.id ? (
              <button
                type="button"
                onClick={() =>
                  setCustomer({
                    id: null,
                    name: null,
                    email: null,
                    phone: null,
                  })
                }
                className="text-muted-foreground hover:text-foreground ml-auto text-xs"
              >
                Clear
              </button>
            ) : (
              <span className="text-muted-foreground ml-auto text-xs">
                Guest
              </span>
            )}
          </div>

          <div className="relative">
            <Input
              value={customerTerm}
              onChange={(event) => setCustomerTerm(event.target.value)}
              placeholder="Search existing customers…"
              className="h-9"
            />
            {customerResults.length > 0 ? (
              <div className="bg-popover absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border p-1 shadow-xl">
                {customerResults.map((result) => (
                  <button
                    key={result.id ?? result.email}
                    type="button"
                    onClick={() => selectCustomer(result)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04]"
                  >
                    <p className="font-medium">{result.name ?? "Guest"}</p>
                    <p className="text-muted-foreground text-xs">
                      {result.email ?? result.phone ?? "—"}
                    </p>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Input
              value={customer.name ?? ""}
              onChange={(event) =>
                setCustomer((c) => ({
                  ...c,
                  name: event.target.value || null,
                }))
              }
              placeholder="Name"
              className="h-9"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={customer.email ?? ""}
                onChange={(event) =>
                  setCustomer((c) => ({
                    ...c,
                    email: event.target.value || null,
                  }))
                }
                placeholder="Email"
                className="h-9"
              />
              <Input
                value={customer.phone ?? ""}
                onChange={(event) =>
                  setCustomer((c) => ({
                    ...c,
                    phone: event.target.value || null,
                  }))
                }
                placeholder="Phone"
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Coupon */}
        <div className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <Ticket className="text-muted-foreground size-4" />
            <h2 className="text-sm font-semibold text-white">Coupon</h2>
          </div>
          {couponPreview ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
              <span className="font-mono text-sm text-emerald-400">
                {couponPreview.code}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-400 tabular-nums">
                  − {formatPaise(couponPreview.discount)}
                </span>
                <button
                  type="button"
                  onClick={clearCoupon}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyCoupon();
                  }
                }}
                placeholder="Enter code"
                className="h-9 font-mono uppercase"
              />
              <Button
                variant="outline"
                onClick={applyCoupon}
                disabled={applyingCoupon}
              >
                {applyingCoupon ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Charges */}
        <div className="bg-card space-y-3 rounded-2xl border p-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Discount</label>
              <PriceInput
                value={manualDiscount}
                onChange={(v) => setManualDiscount(v ?? 0)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Tax</label>
              <PriceInput value={tax} onChange={(v) => setTax(v ?? 0)} />
            </div>
            <div className="space-y-1">
              <label className="text-muted-foreground text-xs">Shipping</label>
              <PriceInput
                value={shipping}
                onChange={(v) => setShipping(v ?? 0)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">
              Payment method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPayment(method.value)}
                  className={cn(
                    "h-9 rounded-lg border text-sm transition-colors",
                    payment === method.value
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-input text-muted-foreground hover:bg-white/[0.03]",
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Note (optional)"
            className="h-9"
          />
        </div>

        {/* Summary */}
        <div className="bg-card space-y-2 rounded-2xl border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPaise(subtotal)}</span>
          </div>
          {discountTotal > 0 ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums">
                − {formatPaise(discountTotal)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatPaise(tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">{formatPaise(shipping)}</span>
          </div>
          <div className="border-border flex justify-between border-t pt-2 text-base font-semibold text-white">
            <span>Total</span>
            <span className="tabular-nums">{formatPaise(grandTotal)}</span>
          </div>

          <Button
            className="mt-2 h-11 w-full rounded-xl text-base"
            onClick={checkout}
            disabled={submitting || cart.length === 0}
          >
            {submitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              `Charge ${formatPaise(grandTotal)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
