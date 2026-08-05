import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BorderGlow } from "./border-glow";
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
              <BorderGlow className="rounded-2xl">
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group bg-secondary relative block aspect-[4/5] overflow-hidden rounded-2xl"
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
                      className="scale-[1.05] object-cover grayscale transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.12] group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#1a1a1d_0%,#0c0c0d_70%)]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/80" />

                  <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl leading-tight font-medium tracking-tight text-white sm:text-[1.6rem]">
                          {category.name}
                        </h3>
                        <span className="bg-gold mt-2 block h-px w-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-10" />
                        <p className="text-gold/80 mt-2 text-[10px] font-medium tracking-[0.22em] uppercase">
                          {category.productCount > 0
                            ? `${category.productCount} ${category.productCount === 1 ? "piece" : "pieces"}`
                            : "Coming soon"}
                        </p>
                      </div>
                      <ArrowUpRight
                        className="text-foreground/70 group-hover:text-gold size-5 shrink-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </Link>
              </BorderGlow>
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
