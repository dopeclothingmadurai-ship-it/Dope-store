import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CampaignBanner } from "@/features/storefront/components/campaign-banner";
import {
  EditorialSplit,
  type SplitRow,
} from "@/features/storefront/components/editorial-split";
import { HomeCategories } from "@/features/storefront/components/home-categories";
import { HomeHero } from "@/features/storefront/components/home-hero";
import { LifestyleGrid } from "@/features/storefront/components/lifestyle-grid";
import { ProductRail } from "@/features/storefront/components/product-rail";
import {
  MaskReveal,
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import { StorySection } from "@/features/storefront/components/story-section";
import { TestimonialCard } from "@/features/storefront/components/testimonial-card";
import {
  listCuratedFits,
  listStoreCategories,
  listStoreProducts,
} from "@/features/storefront/queries";
import { listPublishedTestimonials } from "@/features/testimonials/queries";

export const dynamic = "force-dynamic";

/** Editorial split rows — campaign copy over cinematic photography. */
const SPLIT_ROWS: SplitRow[] = [
  {
    image: "/editorial/editorial-street.jpg",
    eyebrow: "The Everyday",
    title: "Made for the way you actually live",
    body: "Heavyweight cotton, considered cuts, and finishes that only get better with wear. Pieces built to be lived in — not saved for later.",
    href: "/shop",
    cta: "Shop the edit",
  },
  {
    image: "/editorial/editorial-pose.jpg",
    eyebrow: "The Attitude",
    title: "Quiet confidence, worn loud",
    body: "Silhouettes that move with you and hold their shape. Understated by design, unmistakable in person.",
    href: "/categories",
    cta: "Explore categories",
  },
];

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

      {/* 2 · Luxury story — editorial manifesto */}
      <StorySection />

      {/* 3 · This Week at Dope — automatic, newest first */}
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

      {/* 4 · Shop by Category — reuses the category backend */}
      {categories.length > 0 ? (
        <HomeCategories categories={categories} />
      ) : null}

      {/* 5 · Editorial split — campaign spread */}
      <EditorialSplit rows={SPLIT_ROWS} />

      {/* 6 · Curated Fits — manually flagged from the admin */}
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

      {/* 7 · Campaign banner — full-bleed season statement */}
      <CampaignBanner />

      {/* 8 · Lifestyle campaign — editorial photo grid */}
      <LifestyleGrid />

      {/* 9 · Testimonials — staff-curated, from the admin */}
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
                  <TestimonialCard testimonial={testimonial} />
                </RevealItem>
              ))}
            </Stagger>
            <Reveal className="mt-12 text-center">
              <Link
                href="/testimonials"
                className="text-muted-foreground hover:text-foreground text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
              >
                Read all reviews
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}
    </>
  );
}
