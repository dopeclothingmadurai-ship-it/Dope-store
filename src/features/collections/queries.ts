import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type AssignedProduct,
  type Collection,
  type CollectionListItem,
} from "./types";

/** All collections with their assigned-product counts, featured first. */
export async function listCollections(): Promise<CollectionListItem[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .select("*, collection_products(count)")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw fromPostgrestError(error);

  return data.map(({ collection_products, ...collection }) => ({
    ...collection,
    productCount: collection_products[0]?.count ?? 0,
  }));
}

/** Non-archived collections as `{ id, name }` options for selects. */
export async function listCollectionOptions(): Promise<
  { id: string; name: string }[]
> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .select("id, name")
    .is("archived_at", null)
    .order("name", { ascending: true });
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function getCollection(id: string): Promise<Collection | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("collections")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw fromPostgrestError(error);
  return data;
}

/** Products assigned to a collection, in their saved order. */
export async function listCollectionProducts(
  collectionId: string,
): Promise<AssignedProduct[]> {
  const db = createAdminClient();

  const { data: rows, error } = await db
    .from("collection_products")
    .select("product_id, position")
    .eq("collection_id", collectionId)
    .order("position", { ascending: true });

  if (error) throw fromPostgrestError(error);
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.product_id);
  const { data: products, error: productsError } = await db
    .from("products")
    .select("id, title, slug, status")
    .in("id", ids);

  if (productsError) throw fromPostgrestError(productsError);

  const byId = new Map(products.map((product) => [product.id, product]));

  return rows.flatMap((row) => {
    const product = byId.get(row.product_id);
    return product
      ? [
          {
            id: product.id,
            title: product.title,
            slug: product.slug,
            status: product.status,
            position: row.position,
          },
        ]
      : [];
  });
}
