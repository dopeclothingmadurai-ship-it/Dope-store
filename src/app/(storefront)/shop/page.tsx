import { type Metadata } from "next";
import Link from "next/link";

import { Reveal } from "@/features/storefront/components/reveal";
import { ShopGrid } from "@/features/storefront/components/shop-grid";
import {
  getStoreCategory,
  listStoreProducts,
} from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full Dope Store collection.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: categorySlug } = await searchParams;
  const category = categorySlug ? await getStoreCategory(categorySlug) : null;
  const products = await listStoreProducts(undefined, category?.id);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          {category ? "Category" : "The Collection"}
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          {category ? category.name : "Shop All"}
        </h1>
        {category ? (
          <Link
            href="/categories"
            className="text-muted-foreground hover:text-foreground mt-4 inline-block text-[12px] tracking-[0.16em] uppercase transition-colors"
          >
            ← All categories
          </Link>
        ) : null}
      </Reveal>

      <ShopGrid products={products} />
    </div>
  );
}
