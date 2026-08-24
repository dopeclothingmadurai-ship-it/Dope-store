import { type Metadata } from "next";
import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";

import {
  MaskReveal,
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import { TestimonialCard } from "@/features/storefront/components/testimonial-card";
import { listPublishedTestimonials } from "@/features/testimonials";
import { TestimonialSubmitForm } from "@/features/testimonials/components/testimonial-submit-form";
import { getCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "Feeding the culture, starving the hype.",
};

export default async function TestimonialsPage() {
  const [testimonials, customer] = await Promise.all([
    listPublishedTestimonials(60),
    getCustomer(),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mb-14 max-w-3xl sm:mb-20">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            The Culture Speaks
          </p>
        </Reveal>
        <h1 className="font-editorial mt-4 text-4xl leading-[1.03] font-semibold tracking-tight sm:text-6xl">
          <MaskReveal delay={0.05}>
            Feeding the culture, starving the hype
          </MaskReveal>
        </h1>
        <Reveal delay={0.15}>
          <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
            Real words from the people who wear Dope every day.
          </p>
        </Reveal>
      </div>

      {testimonials.length > 0 ? (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <RevealItem key={testimonial.id} className="h-full">
              <TestimonialCard testimonial={testimonial} />
            </RevealItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="border-border flex flex-col items-center border border-dashed px-6 py-24 text-center">
          <MessageSquareQuote
            className="text-muted-foreground/40 size-8"
            strokeWidth={1.5}
          />
          <p className="text-muted-foreground mt-4 text-sm">
            Be the first to speak for the culture.
          </p>
        </Reveal>
      )}

      {/* Share your experience */}
      <section id="share" className="mt-24 sm:mt-32">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
              Your Turn
            </p>
            <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-4xl">
              Speak for the culture
            </h2>
          </div>

          {customer ? (
            <TestimonialSubmitForm defaultName={customer.name} />
          ) : (
            <div className="border-border border border-dashed px-6 py-12 text-center">
              <p className="text-muted-foreground text-sm leading-relaxed">
                <Link
                  href="/account/sign-in?next=/testimonials"
                  className="text-foreground hover:text-gold underline underline-offset-4 transition-colors"
                >
                  Sign in
                </Link>{" "}
                to share your experience. We review every submission before it
                goes live.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
