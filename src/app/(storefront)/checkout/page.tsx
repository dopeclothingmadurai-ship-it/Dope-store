import { type Metadata } from "next";

import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { Reveal } from "@/features/storefront/components/reveal";
import { getCustomer } from "@/lib/auth/customer";
import { isRazorpayConfigured } from "@/lib/razorpay/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const customer = await getCustomer();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          Almost yours
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Checkout
        </h1>
      </Reveal>

      <CheckoutForm
        paymentEnabled={isRazorpayConfigured}
        prefill={{ name: customer?.name ?? "", email: customer?.email ?? "" }}
      />
    </div>
  );
}
