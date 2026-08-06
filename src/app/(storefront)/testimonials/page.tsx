import { type Metadata } from "next";
import { MessageSquareQuote } from "lucide-react";

import {
  MaskReveal,
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import { TestimonialCard } from "@/features/storefront/components/testimonial-card";
import { listPublishedTestimonials } from "@/features/testimonials";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "What the Dope Store crew says.",
};

export default async function TestimonialsPage() {
  const testimonials = await listPublishedTestimonials(60);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mb-14 max-w-2xl sm:mb-20">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            Worn &amp; Reviewed
          </p>
        </Reveal>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-6xl">
          <MaskReveal delay={0.05}>What the crew says</MaskReveal>
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
            Reviews from the crew are coming soon.
          </p>
        </Reveal>
      )}
    </div>
  );
}
