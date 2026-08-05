import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { Stars } from "@/features/reviews/components/star-rating";
import { HomeCategories } from "@/features/storefront/components/home-categories";
import { HomeHero } from "@/features/storefront/components/home-hero";
import { ProductRail } from "@/features/storefront/components/product-rail";
import {
  MaskReveal,
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import { SpotlightCard } from "@/features/storefront/components/spotlight-card";
import {
  listCuratedFits,
  listStoreCategories,
  listStoreProducts,
} from "@/features/storefront/queries";
import { listPublishedTestimonials } from "@/features/testimonials";

export const dynamic = "force-dynamic";

/** First-letter initials for an avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function HomePage() {
  const [thisWeek, categories, curated, testimonials] = await Promise.all([
    listStoreProducts(10),
    listStoreCategories(),
    listCuratedFits(),
    listPublishedTestimonials(),
  ]);

  return (
    <>
      {/* 1 · Hero */}
      <HomeHero />

      {/* 2 · This Week at Dope — automatic, newest first */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
              In Store Now
            </p>
            <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
              This Week at Dope
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-muted-foreground hover:text-foreground group hidden shrink-0 items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors sm:inline-flex"
          >
            View all
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        {thisWeek.length > 0 ? (
          <Reveal>
            <ProductRail products={thisWeek} priority />
          </Reveal>
        ) : (
          <p className="text-muted-foreground py-16 text-center text-sm">
            New pieces are on their way.
          </p>
        )}
      </section>

      {/* 3 · Shop by Category — reuses the category backend */}
      {categories.length > 0 ? (
        <HomeCategories categories={categories} />
      ) : null}

      {/* 4 · Curated Fits — manually flagged from the admin */}
      {curated.length > 0 ? (
        <section className="border-border border-t">
          <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
            <div className="mb-12 max-w-xl">
              <Reveal>
                <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                  Styled by Dope
                </p>
              </Reveal>
              <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
                <MaskReveal delay={0.05}>Curated Fits</MaskReveal>
              </h2>
              <Reveal delay={0.15}>
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  A tighter edit — the pieces we are wearing this season, chosen
                  by the studio.
                </p>
              </Reveal>
            </div>
            <Reveal>
              <ProductRail products={curated} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* 5 · Testimonials — staff-curated, from the admin */}
      {testimonials.length > 0 ? (
        <section id="testimonials" className="border-border border-t">
          <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
            <div className="mb-14 text-center">
              <Reveal>
                <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                  Worn &amp; Reviewed
                </p>
              </Reveal>
              <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
                <MaskReveal delay={0.05}>What the crew says</MaskReveal>
              </h2>
            </div>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <RevealItem key={testimonial.id} className="h-full">
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
                </RevealItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}
    </>
  );
}
