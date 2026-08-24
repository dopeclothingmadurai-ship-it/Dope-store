import { type MetadataRoute } from "next";

import {
  listCategoryLinks,
  listStoreProducts,
} from "@/features/storefront/queries";
import { SITE_URL } from "@/lib/site";

/**
 * Storefront sitemap: indexable static pages, every category listing, and every
 * active product. Admin, checkout, account, auth and API routes are excluded
 * (they are also blocked in robots.ts). Never throws — content queries fall
 * back to an empty list so the sitemap always renders.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    listStoreProducts().catch(() => []),
    listCategoryLinks(100).catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/archive`, changeFrequency: "weekly", priority: 0.5 },
    {
      url: `${SITE_URL}/testimonials`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/shop?category=${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
