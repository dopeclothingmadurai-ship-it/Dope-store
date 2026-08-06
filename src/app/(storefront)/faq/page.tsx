import { type Metadata } from "next";
import Link from "next/link";

import {
  Accordion,
  type AccordionItem,
} from "@/features/storefront/components/accordion";
import { MaskReveal, Reveal } from "@/features/storefront/components/reveal";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about shipping, pickup, payments and more.",
};

const FAQS: AccordionItem[] = [
  {
    question: "How does shipping work?",
    answer:
      "We offer Home Delivery across India. Shipping is free on orders over ₹2,000; otherwise a flat ₹99 applies. Orders are processed manually by our team, so timelines are indicative.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Delivery timelines vary by location since fulfillment is handled manually. We dispatch as quickly as possible after your order is confirmed and move it through Confirmed → Packed → Shipped → Delivered.",
  },
  {
    question: "Can I pick up my order in person?",
    answer:
      "Yes. Choose “Pick Up at Dope Store” at checkout. Once your order is confirmed you can collect it from the nearest Dope Store — no delivery charges.",
  },
  {
    question: "What is the pickup process?",
    answer:
      "After you pay, wait for our team to confirm the order. Then visit the nearest Dope Store and show your Order Number, IRL Perks code, or Order Confirmation email to collect. Pickup orders also unlock an exclusive in-store IRL Perks offer.",
  },
  {
    question: "How are payments handled?",
    answer:
      "Payments are processed securely by Razorpay. Your order is created only after the payment is verified, and we never see or store your card details.",
  },
  {
    question: "When do I get an order confirmation?",
    answer:
      "Immediately after a successful payment you receive an order-confirmation email with your order number, items, and — for pickup — your IRL Perks code and collection details.",
  },
  {
    question: "How do I choose the right size?",
    answer:
      "Each product page lists the available sizes. Many of our pieces have an oversized cut — when in doubt, size down for a closer fit, or reach out and we'll guide you.",
  },
  {
    question: "Do you accept returns?",
    answer:
      "Returns are currently unavailable. All sales are final, so please choose carefully before completing checkout.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Refunds are currently unavailable. Once an order is placed it cannot be cancelled or refunded.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mb-12 sm:mb-16">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            Good to know
          </p>
        </Reveal>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-6xl">
          <MaskReveal delay={0.05}>Frequently asked</MaskReveal>
        </h1>
      </div>

      <Reveal delay={0.1}>
        <Accordion items={FAQS} />
      </Reveal>

      <Reveal delay={0.15} className="mt-14 text-center">
        <p className="text-muted-foreground text-sm">
          Still have a question?{" "}
          <Link
            href="/contact"
            className="text-foreground hover:text-gold underline underline-offset-4 transition-colors"
          >
            Contact us
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
