import "server-only";

import { type PostgrestError } from "@supabase/supabase-js";

import {
  ConflictError,
  InventoryError,
  NotFoundError,
  ValidationError,
  fromPostgrestError,
} from "@/lib/errors";
import {
  SKU_PREFIX,
  buildSku,
  generateSku,
  nextSequence,
  productCode,
  sequenceScope,
} from "@/lib/sku";
import { slugify } from "@/lib/slug";
import { PRODUCT_MEDIA_BUCKET, pathFromPublicUrl } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type InventoryAdjustValues,
  type ProductFormValues,
  type ProductMediaValues,
  type VariantFormValues,
} from "./schema";
import {
  type Inventory,
  type Product,
  type ProductMedia,
  type ProductVariant,
} from "./types";

type Db = ReturnType<typeof createAdminClient>;

function normalize(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Sync a product's collection membership without disturbing the ordering of
 * other products in those collections. Added memberships are appended.
 */
async function syncProductCollections(
  db: Db,
  productId: string,
  collectionIds: string[],
): Promise<void> {
  const { data: existing, error } = await db
    .from("collection_products")
    .select("collection_id")
    .eq("product_id", productId);
  if (error) throw fromPostgrestError(error);

  const existingIds = new Set(existing.map((row) => row.collection_id));
  const selectedIds = new Set(collectionIds);

  const toRemove = [...existingIds].filter((id) => !selectedIds.has(id));
  const toAdd = collectionIds.filter((id) => !existingIds.has(id));

  if (toRemove.length > 0) {
    const { error: removeError } = await db
      .from("collection_products")
      .delete()
      .eq("product_id", productId)
      .in("collection_id", toRemove);
    if (removeError) throw fromPostgrestError(removeError);
  }

  for (const collectionId of toAdd) {
    const { count, error: countError } = await db
      .from("collection_products")
      .select("*", { count: "exact", head: true })
      .eq("collection_id", collectionId);
    if (countError) throw fromPostgrestError(countError);

    const { error: insertError } = await db.from("collection_products").insert({
      collection_id: collectionId,
      product_id: productId,
      position: count ?? 0,
    });
    if (insertError) throw fromPostgrestError(insertError);
  }
}

function toProductRow(input: ProductFormValues) {
  return {
    title: input.title,
    slug: input.slug,
    description: normalize(input.description),
    brand: normalize(input.brand),
    category_id: input.categoryId,
    status: input.status,
    base_price: input.basePrice,
    compare_at_price: input.compareAtPrice,
    featured: input.featured,
    show_in_curated_fits: input.showInCuratedFits,
    tags: input.tags,
    seo_title: normalize(input.seoTitle),
    seo_description: normalize(input.seoDescription),
    archived_at: null,
  };
}

export async function createProduct(
  input: ProductFormValues,
): Promise<Product> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .insert(toProductRow(input))
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  await syncProductCollections(db, data.id, input.collectionIds);
  return data;
}

export async function updateProduct(
  id: string,
  input: ProductFormValues,
): Promise<Product> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update(toProductRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);

  await syncProductCollections(db, id, input.collectionIds);
  return data;
}

export async function archiveProduct(id: string): Promise<Product> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function restoreProduct(id: string): Promise<Product> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({ status: "draft", archived_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Pick the next "X (Copy)" / "X (Copy 2)" title that is not already taken. */
async function nextCopyTitle(db: Db, base: string): Promise<string> {
  const { data, error } = await db
    .from("products")
    .select("title")
    .like("title", `${base} (Copy%`);
  if (error) throw fromPostgrestError(error);
  const used = new Set((data ?? []).map((row) => row.title));
  if (!used.has(`${base} (Copy)`)) return `${base} (Copy)`;
  let n = 2;
  while (used.has(`${base} (Copy ${n})`)) n += 1;
  return `${base} (Copy ${n})`;
}

/** Ensure a slug is unique, appending -2, -3… if needed. */
async function uniqueSlug(db: Db, baseSlug: string): Promise<string> {
  const base = baseSlug || "product";
  let candidate = base;
  let n = 2;
  for (;;) {
    const { data, error } = await db
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (error) throw fromPostgrestError(error);
    if (!data) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

/**
 * Duplicate a product and everything under it (media, variants, inventory
 * settings, collections) in a single transaction via `duplicate_product()`.
 * The copy is always a draft with a "(Copy)" title, fresh timestamps, and
 * newly generated unique SKUs (barcodes cleared, stock reset to 0). Orders and
 * inventory history are never copied.
 */
export async function duplicateProduct(sourceId: string): Promise<Product> {
  const db = createAdminClient();

  const { data: source, error: sourceError } = await db
    .from("products")
    .select("title")
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceError) throw fromPostgrestError(sourceError);
  if (!source) throw new NotFoundError("Product not found.");

  const { data: variants, error: variantsError } = await db
    .from("product_variants")
    .select("id, size, color")
    .eq("product_id", sourceId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (variantsError) throw fromPostgrestError(variantsError);

  const title = await nextCopyTitle(db, source.title);
  const slug = await uniqueSlug(db, slugify(title));

  // Generate fresh unique SKUs with the shared utility, seeded with existing
  // SKUs for the new product's code so per-color sequences continue correctly.
  const { data: existing, error: existingError } = await db
    .from("product_variants")
    .select("sku")
    .like("sku", `${SKU_PREFIX}-${productCode(title)}-%`);
  if (existingError) throw fromPostgrestError(existingError);
  const seen = (existing ?? []).map((row) => row.sku);
  const variantSkus = variants.map((variant) => {
    const sku = generateSku(title, variant.color, variant.size, seen);
    seen.push(sku);
    return { variant_id: variant.id, sku };
  });

  const { data: newId, error: rpcError } = await db.rpc("duplicate_product", {
    p_source_id: sourceId,
    p_title: title,
    p_slug: slug,
    p_variant_skus: variantSkus,
  });
  if (rpcError) throw fromPostgrestError(rpcError);

  const { data: created, error: createdError } = await db
    .from("products")
    .select("*")
    .eq("id", newId)
    .single();
  if (createdError) throw fromPostgrestError(createdError);
  return created;
}

/* -------------------------------------------------------------------------- */
/*  Variants                                                                   */
/* -------------------------------------------------------------------------- */

function toVariantRow(input: VariantFormValues) {
  return {
    sku: input.sku,
    barcode: normalize(input.barcode),
    size: normalize(input.size),
    color: normalize(input.color),
    price_override: input.priceOverride,
    weight_grams: input.weightGrams,
  };
}

/**
 * `product_variants` has three unique constraints (sku, barcode, and the
 * (product_id, size, color) combo). Turn a 23505 into a field-level error on
 * the input that actually collided.
 */
function variantUniqueError(error: PostgrestError): ValidationError {
  const message = error.message ?? "";
  if (message.includes("product_variants_barcode_unique")) {
    return new ValidationError("This barcode is already in use.", {
      barcode: ["This barcode is already in use."],
    });
  }
  if (message.includes("product_variants_combo_idx")) {
    return new ValidationError(
      "A variant with this size and colour already exists.",
      {
        size: ["This size and colour combination already exists."],
        color: ["This size and colour combination already exists."],
      },
    );
  }
  return new ValidationError("This SKU is already in use.", {
    sku: ["This SKU is already in use."],
  });
}

function isSkuConflict(error: PostgrestError): boolean {
  return (error.message ?? "").includes("product_variants_sku_unique");
}

/**
 * Application-level SKU uniqueness check, run before a manual insert/update so a
 * duplicate is rejected with a clear message rather than only surfacing as a DB
 * error. The `product_variants_sku_unique` constraint remains the race-condition
 * backstop (handled via `variantUniqueError`).
 */
async function assertSkuAvailable(
  db: Db,
  sku: string,
  excludeVariantId?: string,
): Promise<void> {
  let query = db.from("product_variants").select("id").eq("sku", sku).limit(1);
  if (excludeVariantId) query = query.neq("id", excludeVariantId);

  const { data, error } = await query.maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (data) {
    throw new ValidationError("This SKU is already in use.", {
      sku: ["This SKU is already in use."],
    });
  }
}

async function nextVariantPosition(db: Db, productId: string): Promise<number> {
  const { count, error } = await db
    .from("product_variants")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw fromPostgrestError(error);
  return count ?? 0;
}

/**
 * Create a variant.
 *
 * When `autoSku` is true the SKU is generated server-side from the product
 * title + color + size; on a concurrent SKU collision the sequence is
 * incremented and the insert retried. A duplicate barcode or size/color combo
 * is rejected immediately with a field error (retrying the SKU can't fix it).
 * When false the admin's manual SKU is used and any duplicate is rejected.
 */
export async function createVariant(
  productId: string,
  input: VariantFormValues,
  autoSku: boolean,
): Promise<ProductVariant> {
  const db = createAdminClient();
  const position = await nextVariantPosition(db, productId);
  const row = { product_id: productId, ...toVariantRow(input), position };

  if (!autoSku) {
    await assertSkuAvailable(db, input.sku);
    const { data, error } = await db
      .from("product_variants")
      .insert(row)
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") throw variantUniqueError(error);
      throw fromPostgrestError(error);
    }
    return data;
  }

  const { data: product, error: productError } = await db
    .from("products")
    .select("title")
    .eq("id", productId)
    .single();
  if (productError) throw fromPostgrestError(productError);

  const scope = sequenceScope(product.title, input.color);
  const { data: existing, error: existingError } = await db
    .from("product_variants")
    .select("sku")
    .like("sku", `${scope}-%`);
  if (existingError) throw fromPostgrestError(existingError);

  let sequence = nextSequence(
    scope,
    (existing ?? []).map((variant) => variant.sku),
  );

  // Retry on the rare concurrent collision, incrementing the sequence.
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const sku = buildSku(product.title, input.color, input.size, sequence);
    const { data, error } = await db
      .from("product_variants")
      .insert({ ...row, sku })
      .select("*")
      .single();
    if (!error) return data;
    if (error.code === "23505") {
      // Only a genuine SKU collision is resolved by a new sequence; a duplicate
      // barcode or size/color combo must be surfaced to the admin.
      if (isSkuConflict(error)) {
        sequence += 1;
        continue;
      }
      throw variantUniqueError(error);
    }
    throw fromPostgrestError(error);
  }

  throw new ConflictError("Could not generate a unique SKU. Please try again.");
}

export async function updateVariant(
  variantId: string,
  input: VariantFormValues,
): Promise<ProductVariant> {
  const db = createAdminClient();
  await assertSkuAvailable(db, input.sku, variantId);
  const { data, error } = await db
    .from("product_variants")
    .update(toVariantRow(input))
    .eq("id", variantId)
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") throw variantUniqueError(error);
    throw fromPostgrestError(error);
  }
  return data;
}

export async function deleteVariant(variantId: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db
    .from("product_variants")
    .delete()
    .eq("id", variantId);
  if (error) throw fromPostgrestError(error);
}

/* -------------------------------------------------------------------------- */
/*  Inventory — always through adjust_inventory()                             */
/* -------------------------------------------------------------------------- */

export async function adjustInventory(
  variantId: string,
  input: InventoryAdjustValues,
): Promise<Inventory> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("adjust_inventory", {
    p_variant_id: variantId,
    p_delta: input.delta,
    p_reason: input.reason,
    p_reference: input.reference ?? undefined,
  });

  if (error) {
    const message = error.message
      .replace(/^.*adjust_inventory:\s*/i, "")
      .trim();
    throw new InventoryError(
      message
        ? message.charAt(0).toUpperCase() + message.slice(1)
        : "Inventory adjustment failed.",
    );
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/*  Media                                                                      */
/* -------------------------------------------------------------------------- */

export async function addProductMedia(
  productId: string,
  input: ProductMediaValues,
): Promise<ProductMedia> {
  const db = createAdminClient();
  const { count, error: countError } = await db
    .from("product_media")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (countError) throw fromPostgrestError(countError);

  const position = count ?? 0;
  const { data, error } = await db
    .from("product_media")
    .insert({
      product_id: productId,
      url: input.url,
      alt: normalize(input.alt),
      position,
      is_primary: position === 0,
    })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function reorderProductMedia(
  productId: string,
  orderedIds: string[],
): Promise<void> {
  const db = createAdminClient();
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await db
      .from("product_media")
      .update({ position: index })
      .eq("id", id)
      .eq("product_id", productId);
    if (error) throw fromPostgrestError(error);
  }
}

export async function setPrimaryProductMedia(
  productId: string,
  mediaId: string,
): Promise<void> {
  const db = createAdminClient();
  const { error: clearError } = await db
    .from("product_media")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearError) throw fromPostgrestError(clearError);

  const { error } = await db
    .from("product_media")
    .update({ is_primary: true })
    .eq("id", mediaId)
    .eq("product_id", productId);
  if (error) throw fromPostgrestError(error);
}

export async function deleteProductMedia(mediaId: string): Promise<void> {
  const db = createAdminClient();
  const { data: media, error } = await db
    .from("product_media")
    .select("*")
    .eq("id", mediaId)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  if (!media) throw new NotFoundError("Image not found.");

  const { error: deleteError } = await db
    .from("product_media")
    .delete()
    .eq("id", mediaId);
  if (deleteError) throw fromPostgrestError(deleteError);

  const path = pathFromPublicUrl(PRODUCT_MEDIA_BUCKET, media.url);
  if (path) {
    // Best-effort storage cleanup; a leftover object must not fail the action.
    await db.storage.from(PRODUCT_MEDIA_BUCKET).remove([path]);
  }

  if (media.is_primary) {
    const { data: next } = await db
      .from("product_media")
      .select("id")
      .eq("product_id", media.product_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await db
        .from("product_media")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }
}
