import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

import {
  MaskReveal,
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import { listArchivedProducts } from "@/features/storefront/queries";
import { formatPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dope Archive",
  description: "Previously released collections — now sold out.",
};

export default async function ArchivePage() {
  const products = await listArchivedProducts();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mb-14 max-w-2xl sm:mb-20">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            Previously released
          </p>
        </Reveal>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-6xl">
          <MaskReveal delay={0.05}>Dope Archive</MaskReveal>
        </h1>
        <Reveal delay={0.15}>
          <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
            The pieces that came and went. Sold out, archived, and remembered —
            a record of collections past.
          </p>
        </Reveal>
      </div>

      {products.length > 0 ? (
        <Stagger className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {products.map((product) => (
            <RevealItem key={product.id}>
              <Link
                href={`/product/${product.slug}`}
                className="group block"
                aria-label={`${product.title} — sold out`}
              >
                <div className="bg-secondary relative aspect-[3/4] overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover grayscale transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="text-muted-foreground/40 flex h-full w-full items-center justify-center">
                      <ImageIcon className="size-8" />
                    </div>
                  )}
                  {/* Exclusive wash + Sold Out badge */}
                  <div className="absolute inset-0 bg-black/40 transition-colors duration-500 group-hover:bg-black/30" />
                  <span className="border-foreground/40 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border px-4 py-1.5 text-[11px] font-medium tracking-[0.28em] uppercase backdrop-blur-sm">
                    Sold Out
                  </span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <h3 className="text-foreground/70 text-sm leading-snug tracking-wide">
                    {product.title}
                  </h3>
                  <span className="text-muted-foreground shrink-0 text-sm tabular-nums line-through">
                    {formatPaise(product.price)}
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </Stagger>
      ) : (
        <Reveal className="border-border flex flex-col items-center border border-dashed px-6 py-24 text-center">
          <p className="text-muted-foreground text-sm">
            The archive is empty — every piece is still in stock.
          </p>
          <Link
            href="/shop"
            className="text-foreground hover:text-gold mt-4 text-[12px] font-medium tracking-[0.16em] uppercase underline underline-offset-4 transition-colors"
          >
            Shop the collection
          </Link>
        </Reveal>
      )}
    </div>
  );
}
