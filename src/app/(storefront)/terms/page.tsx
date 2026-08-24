import { type Metadata } from "next";

import { Reveal } from "@/features/storefront/components/reveal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Dope Store.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          Legal
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mt-4 text-sm">
          Last updated {new Date().getFullYear()}
        </p>
      </Reveal>

      <Reveal
        delay={0.1}
        className="prose-invert text-foreground/85 max-w-none space-y-8 text-sm leading-relaxed"
      >
        <Section title="1. Agreement">
          By browsing or purchasing from Dope Store, you agree to these terms.
          If you do not agree, please do not use the store.
        </Section>
        <Section title="2. Orders & Pricing">
          All prices are in Indian Rupees and inclusive of applicable taxes
          unless stated otherwise. We may correct pricing errors and decline or
          cancel any order before dispatch. An order is confirmed only after
          payment is successfully verified.
        </Section>
        <Section title="3. Payment">
          Payments are processed securely by Razorpay. We never store your card
          or banking details. An order is created only after your payment is
          verified.
        </Section>
        <Section title="4. Shipping & Fulfillment">
          We offer Home Delivery and Pick Up at the nearest Dope Store.
          Fulfillment is handled manually by our team; delivery timelines are
          indicative and may vary. For store pickup, collect your order once it
          has been confirmed by showing your order number or confirmation email.
        </Section>
        <Section title="5. Returns, Refunds & Cancellations">
          All sales are final. We do not offer returns, exchanges, refunds, or
          order cancellations once an order has been placed. Please review your
          selection carefully before completing payment.
        </Section>
        <Section title="6. Product Availability">
          Products are subject to availability. Sold-out pieces move to the Dope
          Archive and may not be restocked.
        </Section>
        <Section title="7. Intellectual Property">
          All content on this site — imagery, text, and branding — belongs to
          Dope Store and may not be reproduced without permission.
        </Section>
        <Section title="8. Limitation of Liability">
          Dope Store is not liable for indirect or incidental damages arising
          from the use of the store or products, to the extent permitted by law.
        </Section>
        <Section title="9. Governing Law">
          These terms are governed by the laws of India, and any disputes are
          subject to the jurisdiction of the courts of India.
        </Section>
        <Section title="10. Contact">
          Questions? Email us at{" "}
          <a
            href="mailto:dopeclothingmadurai@gmail.com"
            className="text-gold underline"
          >
            dopeclothingmadurai@gmail.com
          </a>
          .
        </Section>
      </Reveal>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-foreground text-base font-medium tracking-tight">
        {title}
      </h2>
      <p className="text-muted-foreground mt-2">{children}</p>
    </section>
  );
}
