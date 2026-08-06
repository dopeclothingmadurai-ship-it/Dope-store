import { type Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";

import { ProductCard } from "@/features/storefront/components/product-card";
import { RevealItem, Stagger } from "@/features/storefront/components/reveal";
import { SearchInput } from "@/features/storefront/components/search-input";
import { listCategoryLinks, searchStore } from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [results, categories] = await Promise.all([
    query
      ? searchStore(query)
      : Promise.resolve({ products: [], categories: [] }),
    listCategoryLinks(8),
  ]);

  const hasResults =
    results.products.length > 0 || results.categories.length > 0;

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-24 sm:px-8 sm:pt-36 sm:pb-32">
      <div className="mx-auto mb-12 max-w-2xl">
        <h1 className="font-display mb-6 text-3xl font-light tracking-tight sm:text-4xl">
          Search
        </h1>
        <Suspense fallback={<div className="h-14" />}>
          <SearchInput />
        </Suspense>
      </div>

      {!query ? (
        // Idle state — suggest categories.
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
            Popular categories
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${category.slug}`}
                className="border-border text-foreground/80 hover:border-foreground hover:text-foreground rounded-full border px-4 py-1.5 text-sm transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : hasResults ? (
        <div className="space-y-14">
          {results.categories.length > 0 ? (
            <div>
              <p className="text-muted-foreground/70 mb-4 text-[11px] font-medium tracking-[0.2em] uppercase">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {results.categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/shop?category=${category.slug}`}
                    className="border-border text-foreground/80 hover:border-foreground hover:text-foreground rounded-full border px-4 py-1.5 text-sm transition-colors"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {results.products.length > 0 ? (
            <div>
              <p className="text-muted-foreground/70 mb-6 text-[11px] font-medium tracking-[0.2em] uppercase">
                {results.products.length}{" "}
                {results.products.length === 1 ? "result" : "results"} for “
                {query}”
              </p>
              <Stagger className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
                {results.products.map((product) => (
                  <RevealItem key={product.id}>
                    <ProductCard product={product} />
                  </RevealItem>
                ))}
              </Stagger>
            </div>
          ) : null}
        </div>
      ) : (
        // No results.
        <div className="border-border mx-auto flex max-w-2xl flex-col items-center border border-dashed px-6 py-20 text-center">
          <SearchX
            className="text-muted-foreground/40 size-8"
            strokeWidth={1.5}
          />
          <p className="text-foreground mt-4 text-sm font-medium">
            No results for “{query}”
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try a different search, or browse the collection.
          </p>
          <Link
            href="/shop"
            className="text-foreground hover:text-gold mt-5 text-[12px] font-medium tracking-[0.16em] uppercase underline underline-offset-4 transition-colors"
          >
            Shop all
          </Link>
        </div>
      )}
    </div>
  );
}
