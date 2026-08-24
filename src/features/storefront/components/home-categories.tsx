import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CategoryRevealTile } from "./category-reveal-tile";
import { MaskReveal, Reveal, RevealItem, Stagger } from "./reveal";
import { type StoreCategory } from "../types";

/**
 * "Shop by Category" — a premium home section of BorderGlow tiles. Reuses the
 * storefront category backend; each tile links to the category-filtered shop.
 */
export function HomeCategories({
  categories,
}: {
  categories: StoreCategory[];
}) {
  const shown = categories.slice(0, 6);

  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <Reveal>
              <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                Find your fit
              </p>
            </Reveal>
            <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
              <MaskReveal delay={0.05}>Shop by Category</MaskReveal>
            </h2>
          </div>
          <Reveal>
            <Link
              href="/categories"
              className="text-muted-foreground hover:text-foreground group hidden shrink-0 items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors sm:inline-flex"
            >
              All categories
              <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Reveal>
        </div>

        <Stagger
          gap={0.07}
          className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
        >
          {shown.map((category) => (
            <RevealItem key={category.id}>
              <CategoryRevealTile category={category} />
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
