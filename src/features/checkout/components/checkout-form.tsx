"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { type FormEvent, useMemo, useState } from "react";
import { Check, Loader2, MapPin, Store, X } from "lucide-react";

import {
  cartSubtotal,
  useCart,
} from "@/features/storefront/components/use-cart";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import {
  previewCouponAction,
  startCheckoutAction,
  verifyCheckoutPaymentAction,
} from "../actions";
import { computeShipping } from "../shipping";

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const inputClass =
  "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 h-12 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

export function CheckoutForm({
  paymentEnabled,
  prefill,
}: {
  paymentEnabled: boolean;
  prefill: { name: string; email: string };
}) {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [contact, setContact] = useState({
    name: prefill.name,
    email: prefill.email,
    phone: "",
  });
  const [address, setAddress] = useState({
    name: prefill.name,
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  const discount = coupon ? Math.min(subtotal, coupon.discount) : 0;
  const shipping = computeShipping(subtotal, fulfillment);
  const total = subtotal - discount + shipping;

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    const result = await previewCouponAction({
      code: couponInput.trim(),
      subtotal,
    });
    setCouponLoading(false);
    if (!result.ok) {
      setCoupon(null);
      setCouponError(result.error.message);
      return;
    }
    setCoupon(result.data);
    setCouponInput(result.data.code);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (items.length === 0) return;
    if (!window.Razorpay) {
      setError("Payment is still loading. Please try again in a moment.");
      return;
    }
    setProcessing(true);

    const started = await startCheckoutAction({
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      fulfillmentType: fulfillment,
      contact,
      address: fulfillment === "delivery" ? address : null,
      couponCode: coupon?.code ?? null,
    });

    if (!started.ok) {
      setProcessing(false);
      setError(started.error.message);
      return;
    }

    const { razorpayOrderId, amount, keyId } = started.data;
    const rzp = new window.Razorpay({
      key: keyId,
      order_id: razorpayOrderId,
      amount,
      currency: "INR",
      name: "Dope Store",
      description: "Order payment",
      prefill: {
        name: contact.name,
        email: contact.email,
        contact: contact.phone,
      },
      theme: { color: "#c2a468" },
      modal: { ondismiss: () => setProcessing(false) },
      handler: async (response: RazorpayResponse) => {
        const verified = await verifyCheckoutPaymentAction({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
        if (!verified.ok) {
          setProcessing(false);
          setError(verified.error.message);
          return;
        }
        clear();
        router.push(`/checkout/success?ref=${verified.data.orderId}`);
      },
    });
    rzp.open();
  }

  if (items.length === 0) {
    return (
      <div className="border-border flex flex-col items-center border border-dashed px-6 py-24 text-center">
        <p className="text-muted-foreground text-sm">Your bag is empty.</p>
        <Link
          href="/shop"
          className="text-foreground hover:text-gold mt-4 text-[12px] font-medium tracking-[0.16em] uppercase underline underline-offset-4"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <form
        onSubmit={onSubmit}
        className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16"
      >
        <div className="space-y-10">
          {/* Delivery method */}
          <section>
            <SectionTitle>Delivery method</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <FulfillmentOption
                active={fulfillment === "delivery"}
                onClick={() => setFulfillment("delivery")}
                icon={MapPin}
                title="Home Delivery"
                subtitle="Shipped to your address"
              />
              <FulfillmentOption
                active={fulfillment === "pickup"}
                onClick={() => setFulfillment("pickup")}
                icon={Store}
                title="Pick Up at Dope Store"
                subtitle="Collect in person"
              />
            </div>
          </section>

          {/* Contact */}
          <section>
            <SectionTitle>Contact details</SectionTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Full name"
                autoComplete="name"
                value={contact.name}
                onChange={(e) =>
                  setContact({ ...contact, name: e.target.value })
                }
                required
              />
              <input
                className={inputClass}
                type="tel"
                autoComplete="tel"
                placeholder="Phone"
                value={contact.phone}
                onChange={(e) =>
                  setContact({ ...contact, phone: e.target.value })
                }
                required
              />
              <input
                className={cn(inputClass, "sm:col-span-2")}
                type="email"
                autoComplete="email"
                placeholder="Email (for order confirmation)"
                value={contact.email}
                onChange={(e) =>
                  setContact({ ...contact, email: e.target.value })
                }
                required
              />
            </div>
          </section>

          {/* Address or pickup */}
          {fulfillment === "delivery" ? (
            <section>
              <SectionTitle>Delivery address</SectionTitle>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className={cn(inputClass, "sm:col-span-2")}
                  placeholder="Address line 1"
                  autoComplete="address-line1"
                  value={address.line1}
                  onChange={(e) =>
                    setAddress({ ...address, line1: e.target.value })
                  }
                  required
                />
                <input
                  className={cn(inputClass, "sm:col-span-2")}
                  placeholder="Address line 2 (optional)"
                  autoComplete="address-line2"
                  value={address.line2}
                  onChange={(e) =>
                    setAddress({ ...address, line2: e.target.value })
                  }
                />
                <input
                  className={inputClass}
                  placeholder="City"
                  autoComplete="address-level2"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  required
                />
                <input
                  className={inputClass}
                  placeholder="State"
                  autoComplete="address-level1"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  required
                />
                <input
                  className={inputClass}
                  placeholder="PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={address.pincode}
                  onChange={(e) =>
                    setAddress({ ...address, pincode: e.target.value })
                  }
                  required
                />
              </div>
            </section>
          ) : (
            <section>
              <SectionTitle>Pick up at the nearest Dope Store</SectionTitle>
              <div className="border-border bg-card mt-4 rounded-lg border p-5">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Once your order has been confirmed, you can collect it from
                  the nearest Dope Store by showing your Order Number or Order
                  Confirmation Email.
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="border-border bg-card rounded-2xl border p-6">
            <SectionTitle>Order summary</SectionTitle>
            <ul className="mt-5 divide-y divide-[color:var(--border)]">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex items-start justify-between gap-3 py-3 text-sm"
                >
                  <span className="text-foreground/85 min-w-0">
                    {item.title}
                    {item.size ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · {item.size}
                      </span>
                    ) : null}
                    <span className="text-muted-foreground">
                      {" "}
                      × {item.quantity}
                    </span>
                  </span>
                  <span className="whitespace-nowrap tabular-nums">
                    {formatPaise(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon */}
            <div className="border-border mt-4 border-t pt-4">
              {coupon ? (
                <div className="text-gold flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Check className="size-4" /> {coupon.code} applied
                  </span>
                  <button
                    type="button"
                    aria-label="Remove coupon"
                    onClick={() => {
                      setCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className={cn(inputClass, "h-10")}
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) =>
                      setCouponInput(e.target.value.toUpperCase())
                    }
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="border-input hover:border-foreground text-foreground h-10 shrink-0 border px-4 text-[12px] font-medium tracking-[0.14em] uppercase transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? "…" : "Apply"}
                  </button>
                </div>
              )}
              {couponError ? (
                <p className="text-destructive mt-2 text-xs">{couponError}</p>
              ) : null}
            </div>

            <div className="border-border mt-4 space-y-2 border-t pt-4 text-sm">
              <Row label="Subtotal" value={formatPaise(subtotal)} />
              {discount > 0 ? (
                <Row label="Discount" value={`– ${formatPaise(discount)}`} />
              ) : null}
              <Row
                label="Shipping"
                value={shipping > 0 ? formatPaise(shipping) : "Free"}
                muted={shipping === 0}
              />
              <div className="border-border flex items-center justify-between border-t pt-3 text-base font-medium">
                <span>Total</span>
                <span className="tabular-nums">{formatPaise(total)}</span>
              </div>
            </div>

            {error ? (
              <p className="text-destructive mt-4 text-sm">{error}</p>
            ) : null}

            {paymentEnabled ? (
              <button
                type="submit"
                disabled={processing}
                className="bg-foreground text-background mt-6 flex h-14 w-full items-center justify-center gap-2 text-[13px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {processing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Processing…
                  </>
                ) : (
                  `Pay ${formatPaise(total)}`
                )}
              </button>
            ) : (
              <div className="border-border mt-6 flex items-start gap-2 rounded-lg border border-dashed p-4">
                <Store className="text-gold mt-0.5 size-4 shrink-0" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Online payment will be enabled once the store connects its
                  Razorpay account. Your bag is saved.
                </p>
              </div>
            )}
            <p className="text-muted-foreground/70 mt-4 text-center text-[11px] tracking-wide">
              Secured by Razorpay
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-foreground/80 text-[12px] font-medium tracking-[0.2em] uppercase">
      {children}
    </h2>
  );
}

function FulfillmentOption({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MapPin;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        active
          ? "border-gold bg-gold/5"
          : "border-input hover:border-foreground/40",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          active ? "text-gold" : "text-muted-foreground",
        )}
        strokeWidth={1.5}
      />
      <span>
        <span className="text-foreground block text-sm font-medium">
          {title}
        </span>
        <span className="text-muted-foreground block text-xs">{subtitle}</span>
      </span>
    </button>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", muted && "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}
