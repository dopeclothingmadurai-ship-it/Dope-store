import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ProductReviews,
  getCustomerReview,
  getReviewSummary,
  hasPurchasedProduct,
  listProductReviews,
} from "@/features/reviews";
import { ProductCard } from "@/features/storefront/components/product-card";
import { ProductDetail } from "@/features/storefront/components/product-detail";
import { Reveal } from "@/features/storefront/components/reveal";
import {
  getStoreProduct,
  listStoreProducts,
} from "@/features/storefront/queries";
import { getCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return { title: "Not found" };
  return {
    title: product.title,
    description:
      product.description?.slice(0, 150) ?? `${product.title} — Dope Store.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) notFound();

  const customer = await getCustomer();
  const [others, reviews, summary, hasPurchased, existing] = await Promise.all([
    listStoreProducts(5).then((items) =>
      items.filter((item) => item.slug !== slug),
    ),
    listProductReviews(product.id),
    getReviewSummary(product.id),
    customer ? hasPurchasedProduct(customer.email, product.id) : Promise.resolve(false),
    customer ? getCustomerReview(customer.email, product.id) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-24 pb-8 sm:px-8 sm:pt-32">
      <nav className="text-muted-foreground mb-8 flex items-center gap-2 text-[12px] tracking-[0.14em] uppercase">
        <Link href="/shop" className="hover:text-foreground transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="text-foreground/70 truncate">{product.title}</span>
      </nav>

      <ProductDetail product={product} />

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        summary={summary}
        reviews={reviews}
        eligibility={{
          signedIn: customer !== null,
          hasPurchased,
          existing,
        }}
      />

      {others.length > 0 ? (
        <section className="mt-28 sm:mt-36">
          <Reveal className="mb-10">
            <h2 className="font-display text-2xl font-light tracking-tight sm:text-3xl">
              You may also like
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {others.slice(0, 4).map((item, index) => (
              <Reveal key={item.id} delay={(index % 4) * 0.06}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
