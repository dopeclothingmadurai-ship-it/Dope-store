import { BadgeCheck } from "lucide-react";

import { Stars } from "@/features/reviews/components/star-rating";
import { type StoreTestimonial } from "@/features/testimonials";

import { SpotlightCard } from "./spotlight-card";

/** First-letter initials for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A single testimonial rendered as a SpotlightCard — shared by the homepage
 * section and the dedicated /testimonials page so both stay in sync.
 */
export function TestimonialCard({
  testimonial,
}: {
  testimonial: StoreTestimonial;
}) {
  return (
    <SpotlightCard className="border-border bg-card flex h-full flex-col rounded-2xl border p-7">
      <div className="flex items-center gap-3.5">
        <span className="bg-secondary text-gold flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-medium tracking-wide">
          {initials(testimonial.customerName)}
        </span>
        <div className="min-w-0">
          <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
            {testimonial.customerName}
            {testimonial.verifiedPurchase ? (
              <BadgeCheck className="text-gold size-4 shrink-0" />
            ) : null}
          </p>
          {testimonial.location ? (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {testimonial.location}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">
        <Stars rating={testimonial.rating} />
      </div>
      <blockquote className="text-foreground/90 mt-4 flex-1 text-[15px] leading-relaxed">
        “{testimonial.review}”
      </blockquote>
    </SpotlightCard>
  );
}
