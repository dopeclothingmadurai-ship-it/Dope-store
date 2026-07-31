import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type BulkInventoryMode,
  type BulkPriceMode,
  type BulkStatusValue,
} from "./bulk-schema";
import { duplicateProduct } from "./service";

/** Set status for many products at once (archived_at kept consistent). */
export async function bulkSetStatus(
  ids: string[],
  status: BulkStatusValue,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({
      status,
      archived_at: status === "archived" ? new Date().toISOString() : null,
    })
    .in("id", ids)
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data.length;
}

/** Permanently delete products. Order history is preserved: order_items.product_id
 *  is ON DELETE SET NULL, and variants/media/inventory cascade away. */
export async function bulkDelete(ids: string[]): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .delete()
    .in("id", ids)
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data.length;
}

export async function bulkSetCategory(
  ids: string[],
  categoryId: string | null,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({ category_id: categoryId })
    .in("id", ids)
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data.length;
}

export async function bulkSetBrand(
  ids: string[],
  brand: string | null,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({ brand })
    .in("id", ids)
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data.length;
}

/** Add every selected product to a collection (idempotent). */
export async function bulkAddToCollection(
  ids: string[],
  collectionId: string,
): Promise<number> {
  const db = createAdminClient();
  const rows = ids.map((productId) => ({
    collection_id: collectionId,
    product_id: productId,
  }));
  const { error } = await db.from("collection_products").upsert(rows, {
    onConflict: "collection_id,product_id",
    ignoreDuplicates: true,
  });
  if (error) throw fromPostgrestError(error);
  return ids.length;
}

export async function bulkEditTags(
  ids: string[],
  tags: string[],
  add: boolean,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("bulk_edit_product_tags", {
    p_ids: ids,
    p_tags: tags,
    p_add: add,
  });
  if (error) throw fromPostgrestError(error);
  return data ?? 0;
}

export async function bulkUpdatePrices(
  ids: string[],
  mode: BulkPriceMode,
  value: number,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("bulk_update_product_prices", {
    p_ids: ids,
    p_mode: mode,
    p_value: value,
  });
  if (error) throw fromPostgrestError(error);
  return data ?? 0;
}

export async function bulkAdjustInventory(
  ids: string[],
  mode: BulkInventoryMode,
  value: number,
): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("bulk_adjust_product_inventory", {
    p_ids: ids,
    p_mode: mode,
    p_value: value,
  });
  if (error) throw fromPostgrestError(error);
  return data ?? 0;
}

/** Duplicate each selected product using the existing transactional path. */
export async function bulkDuplicate(ids: string[]): Promise<number> {
  let count = 0;
  for (const id of ids) {
    await duplicateProduct(id);
    count += 1;
  }
  return count;
}
