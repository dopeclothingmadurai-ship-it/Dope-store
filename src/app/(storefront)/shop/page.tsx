import { type Metadata } from "next";

import { Reveal } from "@/features/storefront/components/reveal";
import { ShopGrid } from "@/features/storefront/components/shop-grid";
import { listStoreProducts } from "@/features/storefront/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "The full Dope Store collection.",
};

export default async function ShopPage() {
  const products = await listStoreProducts();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 sm:px-8 sm:pt-36">
      <Reveal className="mb-12">
        <p className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
          The Collection
        </p>
        <h1 className="font-display mt-3 text-4xl font-light tracking-tight sm:text-5xl">
          Shop All
        </h1>
      </Reveal>

      <ShopGrid products={products} />
    </div>
  );
}
