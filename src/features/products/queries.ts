import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type AssignableProduct,
  type BulkProductSummary,
  type InventoryMovementItem,
  type ProductDetail,
  type ProductListResult,
  type ProductSort,
  type ProductStatus,
  type VariantWithInventory,
} from "./types";

export const PRODUCTS_PAGE_SIZE = 20;

const SORT_COLUMNS: Record<
  ProductSort,
  "title" | "base_price" | "status" | "created_at"
> = {
  title: "title",
  price: "base_price",
  status: "status",
  created: "created_at",
};

/**
 * Paginated, searchable, sortable and filterable product list, enriched for the
 * premium list UI (category, primary image, representative SKU, variant count,
 * aggregate inventory and collection names). All enrichment is bounded to the
 * current page of products.
 */
export async function listProducts(params: {
  page?: number;
  search?: string;
  sort?: ProductSort;
  dir?: "asc" | "desc";
  status?: ProductStatus | null;
  categoryId?: string | null;
  collectionId?: string | null;
}): Promise<ProductListResult> {
  const db = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = PRODUCTS_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const sort: ProductSort = params.sort ?? "created";
  const ascending = params.dir === "asc";
  const status = params.status ?? null;
  const categoryId = params.categoryId ?? null;
  const collectionId = params.collectionId ?? null;
  const filters = { status, categoryId, collectionId };
  const emptyResult: ProductListResult = {
    items: [],
    total: 0,
    page,
    pageSize,
    sort,
    dir: ascending ? "asc" : "desc",
    filters,
  };

  // Collection filter → restrict to the product ids in that collection.
  let collectionProductIds: string[] | null = null;
  if (collectionId) {
    const { data: links, error } = await db
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collectionId);
    if (error) throw fromPostgrestError(error);
    collectionProductIds = links.map((row) => row.product_id);
    if (collectionProductIds.length === 0) return emptyResult;
  }

  let query = db.from("products").select("*", { count: "exact" });
  const search = params.search?.trim();
  if (search) query = query.ilike("title", `%${search}%`);
  if (status) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (collectionProductIds) query = query.in("id", collectionProductIds);

  const { data, error, count } = await query
    .order(SORT_COLUMNS[sort], { ascending })
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
  const variantsByProduct = new Map<string, { id: string; sku: string }[]>();
  const inventoryByVariant = new Map<
    string,
    { quantity: number; reserved: number; threshold: number }
  >();
  const collectionsByProduct = new Map<string, string[]>();

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

    const { data: variants, error: variantsError } = await db
      .from("product_variants")
      .select("id, sku, product_id")
      .in("product_id", productIds)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true });
    if (variantsError) throw fromPostgrestError(variantsError);
    const variantIds: string[] = [];
    for (const variant of variants) {
      const list = variantsByProduct.get(variant.product_id) ?? [];
      list.push({ id: variant.id, sku: variant.sku });
      variantsByProduct.set(variant.product_id, list);
      variantIds.push(variant.id);
    }

    if (variantIds.length > 0) {
      const { data: inventory, error: inventoryError } = await db
        .from("inventory")
        .select("variant_id, quantity, reserved_quantity, low_stock_threshold")
        .in("variant_id", variantIds);
      if (inventoryError) throw fromPostgrestError(inventoryError);
      for (const row of inventory) {
        inventoryByVariant.set(row.variant_id, {
          quantity: row.quantity,
          reserved: row.reserved_quantity,
          threshold: row.low_stock_threshold,
        });
      }
    }

    const { data: links, error: linksError } = await db
      .from("collection_products")
      .select("product_id, collection_id")
      .in("product_id", productIds);
    if (linksError) throw fromPostgrestError(linksError);
    if (links.length > 0) {
      const linkCollectionIds = [
        ...new Set(links.map((link) => link.collection_id)),
      ];
      const collectionNames = new Map<string, string>();
      const { data: cols, error: colsError } = await db
        .from("collections")
        .select("id, name")
        .in("id", linkCollectionIds);
      if (colsError) throw fromPostgrestError(colsError);
      for (const col of cols) collectionNames.set(col.id, col.name);
      for (const link of links) {
        const name = collectionNames.get(link.collection_id);
        if (!name) continue;
        const list = collectionsByProduct.get(link.product_id) ?? [];
        list.push(name);
        collectionsByProduct.set(link.product_id, list);
      }
    }
  }

  return {
    items: data.map((product) => {
      const variants = variantsByProduct.get(product.id) ?? [];
      let available = 0;
      let reserved = 0;
      let anyLow = false;
      for (const variant of variants) {
        const inv = inventoryByVariant.get(variant.id);
        if (!inv) continue;
        const variantAvailable = inv.quantity - inv.reserved;
        available += variantAvailable;
        reserved += inv.reserved;
        if (variantAvailable <= inv.threshold) anyLow = true;
      }
      const hasVariants = variants.length > 0;
      return {
        ...product,
        categoryName: product.category_id
          ? (categoryNames.get(product.category_id) ?? null)
          : null,
        primaryImageUrl: primaryImages.get(product.id) ?? null,
        sku: variants[0]?.sku ?? null,
        variantCount: variants.length,
        available,
        reserved,
        lowStock: hasVariants && available > 0 && anyLow,
        outOfStock: hasVariants && available <= 0,
        collectionNames: collectionsByProduct.get(product.id) ?? [],
      };
    }),
    total: count ?? 0,
    page,
    pageSize,
    sort,
    dir: ascending ? "asc" : "desc",
    filters,
  };
}

/** Recent inventory movements for every variant of a product (audit history). */
export async function listProductInventoryMovements(
  productId: string,
  limit = 50,
): Promise<InventoryMovementItem[]> {
  const db = createAdminClient();

  const { data: variants, error: variantsError } = await db
    .from("product_variants")
    .select("id, sku")
    .eq("product_id", productId);
  if (variantsError) throw fromPostgrestError(variantsError);
  if (variants.length === 0) return [];

  const skuByVariant = new Map(variants.map((v) => [v.id, v.sku]));

  const { data, error } = await db
    .from("inventory_movements")
    .select("*")
    .in(
      "variant_id",
      variants.map((v) => v.id),
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw fromPostgrestError(error);

  return data.map((movement) => ({
    ...movement,
    sku: skuByVariant.get(movement.variant_id) ?? "—",
  }));
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

/** Price + total stock for the selected products, for bulk-edit previews. */
export async function getBulkProductSummaries(
  ids: string[],
): Promise<BulkProductSummary[]> {
  if (ids.length === 0) return [];
  const db = createAdminClient();

  const [productsResult, variantsResult] = await Promise.all([
    db.from("products").select("id, title, base_price").in("id", ids),
    db
      .from("product_variants")
      .select("product_id, inventory(quantity)")
      .in("product_id", ids),
  ]);
  if (productsResult.error) throw fromPostgrestError(productsResult.error);
  if (variantsResult.error) throw fromPostgrestError(variantsResult.error);

  const stockByProduct = new Map<string, number>();
  const variantsByProduct = new Map<string, number>();
  for (const variant of variantsResult.data) {
    const quantity = variant.inventory?.quantity ?? 0;
    stockByProduct.set(
      variant.product_id,
      (stockByProduct.get(variant.product_id) ?? 0) + quantity,
    );
    variantsByProduct.set(
      variant.product_id,
      (variantsByProduct.get(variant.product_id) ?? 0) + 1,
    );
  }

  return productsResult.data
    .map((product) => ({
      id: product.id,
      title: product.title,
      basePrice: product.base_price,
      stock: stockByProduct.get(product.id) ?? 0,
      variantCount: variantsByProduct.get(product.id) ?? 0,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
