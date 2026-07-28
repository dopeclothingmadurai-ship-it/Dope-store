import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type AssignableProduct,
  type ProductDetail,
  type ProductListResult,
  type VariantWithInventory,
} from "./types";

export const PRODUCTS_PAGE_SIZE = 20;

/** Paginated, searchable product list enriched with category name + primary image. */
export async function listProducts(params: {
  page?: number;
  search?: string;
}): Promise<ProductListResult> {
  const db = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = PRODUCTS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db.from("products").select("*", { count: "exact" });
  const search = params.search?.trim();
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw fromPostgrestError(error);

  const productIds = data.map((product) => product.id);
  const categoryIds = [
    ...new Set(
      data
        .map((product) => product.category_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const categoryNames = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories, error: categoryError } = await db
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);
    if (categoryError) throw fromPostgrestError(categoryError);
    for (const category of categories)
      categoryNames.set(category.id, category.name);
  }

  const primaryImages = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: media, error: mediaError } = await db
      .from("product_media")
      .select("product_id, url, is_primary, position")
      .in("product_id", productIds)
      .order("is_primary", { ascending: false })
      .order("position", { ascending: true });
    if (mediaError) throw fromPostgrestError(mediaError);
    for (const item of media) {
      if (!primaryImages.has(item.product_id)) {
        primaryImages.set(item.product_id, item.url);
      }
    }
  }

  return {
    items: data.map((product) => ({
      ...product,
      categoryName: product.category_id
        ? (categoryNames.get(product.category_id) ?? null)
        : null,
      primaryImageUrl: primaryImages.get(product.id) ?? null,
    })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** Full product detail for the editor: media, variants+inventory, collections. */
export async function getProductDetail(
  id: string,
): Promise<ProductDetail | null> {
  const db = createAdminClient();

  const { data: product, error } = await db
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!product) return null;

  const [mediaResult, variantsResult, collectionsResult] = await Promise.all([
    db
      .from("product_media")
      .select("*")
      .eq("product_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    db
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    db.from("collection_products").select("collection_id").eq("product_id", id),
  ]);

  if (mediaResult.error) throw fromPostgrestError(mediaResult.error);
  if (variantsResult.error) throw fromPostgrestError(variantsResult.error);
  if (collectionsResult.error)
    throw fromPostgrestError(collectionsResult.error);

  const variantIds = variantsResult.data.map((variant) => variant.id);
  const inventoryByVariant = new Map<
    string,
    VariantWithInventory["inventory"]
  >();
  if (variantIds.length > 0) {
    const { data: inventory, error: inventoryError } = await db
      .from("inventory")
      .select("*")
      .in("variant_id", variantIds);
    if (inventoryError) throw fromPostgrestError(inventoryError);
    for (const row of inventory) inventoryByVariant.set(row.variant_id, row);
  }

  return {
    ...product,
    media: mediaResult.data,
    variants: variantsResult.data.map((variant) => ({
      ...variant,
      inventory: inventoryByVariant.get(variant.id) ?? null,
    })),
    collectionIds: collectionsResult.data.map((row) => row.collection_id),
  };
}

/** Non-archived products for the collection assignment picker. */
export async function listAssignableProducts(): Promise<AssignableProduct[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .select("id, title, status")
    .neq("status", "archived")
    .order("title", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data;
}
