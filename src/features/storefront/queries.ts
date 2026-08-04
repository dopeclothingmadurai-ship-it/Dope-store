import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type StoreProductCard,
  type StoreProductDetail,
  type StoreReview,
  type StoreVariant,
} from "./types";

type MediaRow = {
  product_id: string;
  url: string;
  is_primary: boolean;
  position: number;
};

function buildMediaMap(rows: MediaRow[]): Map<string, string[]> {
  const byProduct = new Map<string, MediaRow[]>();
  for (const row of rows) {
    const list = byProduct.get(row.product_id) ?? [];
    list.push(row);
    byProduct.set(row.product_id, list);
  }
  const urls = new Map<string, string[]>();
  for (const [productId, list] of byProduct) {
    list.sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.position - b.position;
    });
    urls.set(
      productId,
      list.map((m) => m.url),
    );
  }
  return urls;
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  base_price: number;
  compare_at_price: number | null;
};

const CARD_COLUMNS = "id, slug, title, base_price, compare_at_price";

/** Attach primary + hover images to a set of product rows. */
async function toCards(
  db: ReturnType<typeof createAdminClient>,
  products: ProductRow[],
): Promise<StoreProductCard[]> {
  if (products.length === 0) return [];
  const { data: media, error } = await db
    .from("product_media")
    .select("product_id, url, is_primary, position")
    .in(
      "product_id",
      products.map((p) => p.id),
    );
  if (error) throw fromPostgrestError(error);
  const mediaMap = buildMediaMap(media);

  return products.map((product) => {
    const images = mediaMap.get(product.id) ?? [];
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.base_price,
      compareAtPrice: product.compare_at_price,
      imageUrl: images[0] ?? null,
      hoverImageUrl: images[1] ?? null,
    };
  });
}

/** Active products as storefront cards, newest first ("This Week at Dope"). */
export async function listStoreProducts(
  limit?: number,
): Promise<StoreProductCard[]> {
  const db = createAdminClient();
  let query = db
    .from("products")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data: products, error } = await query;
  if (error) throw fromPostgrestError(error);
  return toCards(db, products);
}

/** Products flagged "Show in Curated Fits" from the admin, newest first. */
export async function listCuratedFits(limit = 12): Promise<StoreProductCard[]> {
  const db = createAdminClient();
  const { data: products, error } = await db
    .from("products")
    .select(CARD_COLUMNS)
    .eq("status", "active")
    .eq("show_in_curated_fits", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw fromPostgrestError(error);
  return toCards(db, products);
}

/**
 * Published reviews rated 4.5+ for the homepage testimonials (text only).
 * Ratings are whole stars, so the 4.5+ bucket is the 5-star reviews.
 */
export async function listHomepageTestimonials(
  limit = 9,
): Promise<StoreReview[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("reviews")
    .select("id, author_name, rating, body, image_urls, created_at")
    .eq("status", "published")
    .gte("rating", 5)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw fromPostgrestError(error);
  return data.map((review) => ({
    id: review.id,
    authorName: review.author_name,
    rating: review.rating,
    body: review.body,
    imageUrls: [],
    createdAt: review.created_at,
  }));
}

/** A single active product for its detail page, or null if unavailable. */
export async function getStoreProduct(
  slug: string,
): Promise<StoreProductDetail | null> {
  const db = createAdminClient();
  const { data: product, error } = await db
    .from("products")
    .select(
      "id, slug, title, description, brand, base_price, compare_at_price, status",
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!product) return null;

  const [mediaResult, variantsResult] = await Promise.all([
    db
      .from("product_media")
      .select("product_id, url, is_primary, position")
      .eq("product_id", product.id),
    db
      .from("product_variants")
      .select("id, size, color, sku, price_override, position")
      .eq("product_id", product.id)
      .order("position", { ascending: true }),
  ]);
  if (mediaResult.error) throw fromPostgrestError(mediaResult.error);
  if (variantsResult.error) throw fromPostgrestError(variantsResult.error);

  const images = buildMediaMap(mediaResult.data).get(product.id) ?? [];
  const variants: StoreVariant[] = variantsResult.data.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    price: variant.price_override ?? product.base_price,
  }));

  const sizes = [
    ...new Set(
      variants
        .map((v) => v.size)
        .filter((size): size is string => Boolean(size)),
    ),
  ];
  const colors = [
    ...new Set(
      variants
        .map((v) => v.color)
        .filter((color): color is string => Boolean(color)),
    ),
  ];

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    brand: product.brand,
    price: product.base_price,
    compareAtPrice: product.compare_at_price,
    images,
    variants,
    sizes,
    colors,
  };
}
