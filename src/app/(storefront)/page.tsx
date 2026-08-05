import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Stars } from "@/features/reviews/components/star-rating";
import { HomeHero } from "@/features/storefront/components/home-hero";
import { ProductRail } from "@/features/storefront/components/product-rail";
import { Reveal } from "@/features/storefront/components/reveal";
import {
  listCuratedFits,
  listHomepageTestimonials,
  listStoreProducts,
} from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [thisWeek, curated, testimonials] = await Promise.all([
    listStoreProducts(10),
    listCuratedFits(),
    listHomepageTestimonials(),
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

      {/* 3 · Curated Fits — manually flagged from the admin */}
      {curated.length > 0 ? (
        <section className="border-border border-t">
          <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
            <Reveal className="mb-12 max-w-xl">
              <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                Styled by Dope
              </p>
              <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
                Curated Fits
              </h2>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                A tighter edit — the pieces we are wearing this season, chosen
                by the studio.
              </p>
            </Reveal>
            <Reveal>
              <ProductRail products={curated} />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* 4 · Testimonials — real published reviews rated 4.5+ */}
      {testimonials.length > 0 ? (
        <section className="border-border border-t">
          <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
            <Reveal className="mb-14 text-center">
              <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                Worn & Reviewed
              </p>
              <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
                What the crew says
              </h2>
            </Reveal>
            <div className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((review, index) => (
                <Reveal key={review.id} delay={(index % 3) * 0.08}>
                  <figure className="flex h-full flex-col">
                    <Stars rating={review.rating} />
                    <blockquote className="text-foreground/90 mt-5 flex-1 text-[15px] leading-relaxed">
                      “{review.body}”
                    </blockquote>
                    <figcaption className="text-muted-foreground mt-6 text-[12px] font-medium tracking-[0.16em] uppercase">
                      {review.authorName}
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
