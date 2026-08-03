import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type StoreProductCard,
  type StoreProductDetail,
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

/** Active products as storefront cards, newest first. */
export async function listStoreProducts(
  limit?: number,
): Promise<StoreProductCard[]> {
  const db = createAdminClient();
  let query = db
    .from("products")
    .select("id, slug, title, base_price, compare_at_price")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data: products, error } = await query;
  if (error) throw fromPostgrestError(error);
  if (products.length === 0) return [];

  const { data: media, error: mediaError } = await db
    .from("product_media")
    .select("product_id, url, is_primary, position")
    .in(
      "product_id",
      products.map((p) => p.id),
    );
  if (mediaError) throw fromPostgrestError(mediaError);
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
