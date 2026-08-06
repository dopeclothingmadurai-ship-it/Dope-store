import { type Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";

import { Reveal } from "@/features/storefront/components/reveal";

export const metadata: Metadata = { title: "Payment failed" };

export default function PaymentFailedPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center sm:px-8">
      <Reveal className="flex flex-col items-center">
        <span className="border-destructive/40 text-destructive flex size-14 items-center justify-center rounded-full border">
          <XCircle className="size-6" />
        </span>
        <p className="text-gold mt-6 text-[11px] font-medium tracking-[0.3em] uppercase">
          Payment not completed
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
          Your payment couldn&apos;t be completed and no order was created. If
          any amount was deducted, it will be reversed automatically. Your bag
          is still saved — please try again.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/checkout"
            className="bg-foreground text-background flex h-12 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
          >
            Try again
          </Link>
          <Link
            href="/shop"
            className="border-border hover:border-foreground text-foreground flex h-12 items-center justify-center border px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
