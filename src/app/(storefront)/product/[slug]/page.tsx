import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ProductReviews,
  getReviewEligibility,
  listProductReviews,
  summarizeReviews,
} from "@/features/reviews";
import { ProductCard } from "@/features/storefront/components/product-card";
import { ProductDetail } from "@/features/storefront/components/product-detail";
import {
  Reveal,
  RevealItem,
  Stagger,
} from "@/features/storefront/components/reveal";
import {
  getStoreProduct,
  listStoreProducts,
} from "@/features/storefront/queries";
import { getCustomer } from "@/lib/auth/customer";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProduct(slug);
  if (!product) return { title: "Not found" };

  const description =
    product.description?.slice(0, 150) ?? `${product.title} — ${SITE_NAME}.`;
  const path = `/product/${product.slug}`;

  return {
    title: product.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: path,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
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
  const [others, reviews, eligibility] = await Promise.all([
    listStoreProducts(5).then((items) =>
      items.filter((item) => item.slug !== slug),
    ),
    listProductReviews(product.id),
    customer
      ? getReviewEligibility(customer.email, product.id)
      : Promise.resolve({
          signedIn: false,
          hasPurchased: false,
          existing: null,
        }),
  ]);

  const summary = summarizeReviews(reviews);

  // Product structured data (JSON-LD) for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/product/${product.slug}`,
    },
    aggregateRating:
      summary.count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: summary.average,
            reviewCount: summary.count,
          }
        : undefined,
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-8 sm:px-8 sm:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav
        aria-label="Breadcrumb"
        className="text-muted-foreground mb-8 flex items-center gap-2 text-[12px] tracking-[0.14em] uppercase"
      >
        <Link href="/shop" className="hover:text-foreground transition-colors">
          Shop
        </Link>
        <span aria-hidden>/</span>
        <span className="text-foreground/70 truncate">{product.title}</span>
      </nav>

      <ProductDetail product={product} />

      <ProductReviews
        productId={product.id}
        productSlug={product.slug}
        summary={summary}
        reviews={reviews}
        eligibility={eligibility}
      />

      {others.length > 0 ? (
        <section className="mt-28 sm:mt-36">
          <Reveal className="mb-10">
            <h2 className="font-display text-2xl font-light tracking-tight sm:text-3xl">
              You may also like
            </h2>
          </Reveal>
          <Stagger className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {others.slice(0, 4).map((item) => (
              <RevealItem key={item.id}>
                <ProductCard product={item} />
              </RevealItem>
            ))}
          </Stagger>
        </section>
      ) : null}
    </div>
  );
}
