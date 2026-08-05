import { type MetadataRoute } from "next";

import { listStoreProducts } from "@/features/storefront/queries";
import { SITE_URL } from "@/lib/site";

/** Storefront sitemap: static pages plus every active product. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listStoreProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
