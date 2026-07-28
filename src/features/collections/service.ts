import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type CollectionFormValues } from "./schema";
import { type Collection } from "./types";

export async function createCollection(
  input: CollectionFormValues,
): Promise<Collection> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .insert({
      name: input.name,
      slug: input.slug,
      type: input.type,
      is_featured: input.isFeatured,
    })
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateCollection(
  id: string,
  input: CollectionFormValues,
): Promise<Collection> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .update({
      name: input.name,
      slug: input.slug,
      type: input.type,
      is_featured: input.isFeatured,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function archiveCollection(id: string): Promise<Collection> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

export async function restoreCollection(id: string): Promise<Collection> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .update({ archived_at: null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw fromPostgrestError(error);
  return data;
}

/**
 * Replace a collection's product assignment with the given ordered list.
 * Positions are assigned by array index.
 */
export async function setCollectionProducts(
  collectionId: string,
  orderedProductIds: string[],
): Promise<void> {
  const db = createAdminClient();

  const { error: deleteError } = await db
    .from("collection_products")
    .delete()
    .eq("collection_id", collectionId);
  if (deleteError) throw fromPostgrestError(deleteError);

  if (orderedProductIds.length === 0) return;

  const rows = orderedProductIds.map((productId, index) => ({
    collection_id: collectionId,
    product_id: productId,
    position: index,
  }));

  const { error: insertError } = await db
    .from("collection_products")
    .insert(rows);
  if (insertError) throw fromPostgrestError(insertError);
}
