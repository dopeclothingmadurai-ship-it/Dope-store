import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type StoreCategory,
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

/**
 * Active products as storefront cards, newest first ("This Week at Dope").
 * Optionally scoped to a single category (for the category-filtered shop).
 */
export async function listStoreProducts(
  limit?: number,
  categoryId?: string,
): Promise<StoreProductCard[]> {
  const db = createAdminClient();
  let query = db.from("products").select(CARD_COLUMNS).eq("status", "active");
  if (categoryId) query = query.eq("category_id", categoryId);
  query = query.order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data: products, error } = await query;
  if (error) throw fromPostgrestError(error);
  return toCards(db, products);
}

/** A single active (non-archived) category by slug, or null. */
export async function getStoreCategory(
  slug: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}

/**
 * Storefront categories with a live product count and a representative image
 * (the category's own image if set, else the newest product's primary image).
 */
export async function listStoreCategories(): Promise<StoreCategory[]> {
  const db = createAdminClient();
  const { data: cats, error } = await db
    .from("categories")
    .select("id, name, slug, image_url")
    .is("archived_at", null)
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw fromPostgrestError(error);

  const { data: products, error: productsError } = await db
    .from("products")
    .select("id, category_id")
    .eq("status", "active")
    .not("category_id", "is", null)
    .order("created_at", { ascending: false });
  if (productsError) throw fromPostgrestError(productsError);

  const countByCategory = new Map<string, number>();
  const repProductByCategory = new Map<string, string>();
  for (const product of products) {
    if (!product.category_id) continue;
    countByCategory.set(
      product.category_id,
      (countByCategory.get(product.category_id) ?? 0) + 1,
    );
    if (!repProductByCategory.has(product.category_id)) {
      repProductByCategory.set(product.category_id, product.id);
    }
  }

  const repIds = [...repProductByCategory.values()];
  const imageByProduct = new Map<string, string>();
  if (repIds.length > 0) {
    const { data: media, error: mediaError } = await db
      .from("product_media")
      .select("product_id, url, is_primary, position")
      .in("product_id", repIds);
    if (mediaError) throw fromPostgrestError(mediaError);
    for (const [productId, urls] of buildMediaMap(media)) {
      if (urls[0]) imageByProduct.set(productId, urls[0]);
    }
  }

  return cats.map((category) => {
    const repProduct = repProductByCategory.get(category.id);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount: countByCategory.get(category.id) ?? 0,
      imageUrl:
        category.image_url ??
        (repProduct ? (imageByProduct.get(repProduct) ?? null) : null),
    };
  });
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
