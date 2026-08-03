import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/features/storefront/components/product-card";
import { Reveal } from "@/features/storefront/components/reveal";
import { listStoreProducts } from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await listStoreProducts(8);
  const hero = products[0];

  return (
    <>
      {/* Hero */}
      <section className="relative grid min-h-screen lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center px-6 pt-10 pb-20 sm:px-10 lg:order-1 lg:px-16 lg:pt-28">
          <Reveal>
            <p className="text-gold text-[11px] font-medium tracking-[0.34em] uppercase">
              New Season
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="font-display mt-6 text-5xl leading-[0.95] font-light tracking-tight text-white sm:text-6xl lg:text-7xl">
              Dressed in
              <br />
              confidence.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-muted-foreground mt-7 max-w-md text-base leading-relaxed">
              Considered clothing, made to last and worn on your terms. A
              wardrobe of quiet, deliberate essentials from Dope Store.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <Link
              href="/shop"
              className="group text-foreground mt-10 inline-flex items-center gap-3 text-[13px] font-medium tracking-[0.18em] uppercase"
            >
              <span className="border-foreground/40 group-hover:border-foreground border-b pb-1 transition-colors">
                Explore the collection
              </span>
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="bg-secondary relative order-1 min-h-[62vh] overflow-hidden lg:order-2 lg:min-h-screen">
          {hero?.imageUrl ? (
            <Image
              src={hero.imageUrl}
              alt={hero.title}
              fill
              unoptimized
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="from-secondary to-background absolute inset-0 bg-gradient-to-b" />
          )}
          <div className="from-background/50 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent lg:bg-gradient-to-r" />
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-28">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
              The Latest
            </p>
            <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-4xl">
              New Arrivals
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-muted-foreground hover:text-foreground group inline-flex shrink-0 items-center gap-2 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
          >
            View all
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>

        {products.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            New pieces are on their way.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 4) * 0.06}>
                <ProductCard product={product} priority={index < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Editorial statement */}
      <section className="border-border border-t">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <p className="font-display text-3xl leading-tight font-light tracking-tight sm:text-4xl lg:text-[2.75rem]">
              We design for the person who has nothing to prove — pieces that
              speak softly and last for years.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex items-end lg:col-span-5">
            <div className="space-y-5">
              <p className="text-muted-foreground text-sm leading-relaxed">
                Every garment begins with restraint: honest materials, precise
                cuts, and a colour story built around matte black and warm
                metal. Nothing loud. Everything intentional.
              </p>
              <Link
                href="/shop"
                className="border-foreground/40 hover:border-foreground inline-block border-b pb-1 text-[13px] font-medium tracking-[0.16em] uppercase transition-colors"
              >
                Shop the range
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
