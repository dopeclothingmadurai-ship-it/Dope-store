import { type Metadata } from "next";

import { CategoryGrid } from "@/features/storefront/components/category-grid";
import { Reveal } from "@/features/storefront/components/reveal";
import { listStoreCategories } from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description: "Shop Dope Store by category.",
};

export default async function CategoriesPage() {
  const categories = await listStoreCategories();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-20 sm:px-8 sm:pt-36 sm:pb-28">
      <Reveal className="mb-12 sm:mb-16">
        <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
          Browse
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-6xl">
          Categories
        </h1>
        <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed">
          Every silhouette, organised. Choose a category to explore the edit.
        </p>
      </Reveal>

      {categories.length > 0 ? (
        <CategoryGrid categories={categories} />
      ) : (
        <p className="text-muted-foreground py-24 text-center text-sm">
          Categories are on their way.
        </p>
      )}
    </div>
  );
}
