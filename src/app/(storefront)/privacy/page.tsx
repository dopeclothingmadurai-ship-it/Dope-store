import { type Metadata } from "next";

import { Reveal } from "@/features/storefront/components/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Dope Store handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          Legal
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mt-4 text-sm">
          Last updated {new Date().getFullYear()}
        </p>
      </Reveal>

      <Reveal
        delay={0.1}
        className="text-foreground/85 max-w-none space-y-8 text-sm leading-relaxed"
      >
        <Section title="1. What we collect">
          When you place an order or create an account, we collect your name,
          email, phone number, and — for delivery — your shipping address. We
          also keep a record of your orders.
        </Section>
        <Section title="2. How we use it">
          We use your information to process and fulfill orders, send you a
          single order-confirmation email, provide support, and — only if you
          opt in — send occasional updates about new drops.
        </Section>
        <Section title="3. Payments">
          Payments are processed by Razorpay. Your card and banking details are
          handled directly by Razorpay under their security standards; we never
          see or store them.
        </Section>
        <Section title="4. Sharing">
          We share information only with the service providers needed to run the
          store (such as our payment and hosting providers) and where required
          by law. We never sell your data.
        </Section>
        <Section title="5. Cookies">
          We use essential cookies to keep you signed in and to remember your
          bag and wishlist on your device. Your wishlist and cart are stored
          locally in your browser.
        </Section>
        <Section title="6. Data retention">
          We keep order records for as long as needed to operate the business
          and meet legal obligations.
        </Section>
        <Section title="7. Your choices">
          You can update your account details at any time and unsubscribe from
          marketing emails via the link in any such email. To request deletion
          of your data, contact us.
        </Section>
        <Section title="8. Contact">
          For any privacy question, email{" "}
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
