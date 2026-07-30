import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type PosCustomer, type PosSearchItem } from "./types";

function variantLabel(
  size: string | null,
  color: string | null,
): string | null {
  const parts = [color, size].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : null;
}

/** Search sellable variants (non-archived products) by product title or SKU. */
export async function searchItems(term: string): Promise<PosSearchItem[]> {
  const query = term.trim();
  if (!query) return [];
  const db = createAdminClient();
  const escaped = query.replace(/[%,]/g, "");

  const [productsResult, skuResult] = await Promise.all([
    db
      .from("products")
      .select("id, title, base_price")
      .is("archived_at", null)
      .ilike("title", `%${escaped}%`)
      .limit(15),
    db
      .from("product_variants")
      .select("id, sku, size, color, price_override, product_id")
      .ilike("sku", `%${escaped}%`)
      .limit(15),
  ]);
  if (productsResult.error) throw fromPostgrestError(productsResult.error);
  if (skuResult.error) throw fromPostgrestError(skuResult.error);

  const productMap = new Map(productsResult.data.map((p) => [p.id, p]));

  // Variants belonging to title matches.
  let productVariants: {
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    price_override: number | null;
    product_id: string;
  }[] = [];
  if (productMap.size > 0) {
    const { data, error } = await db
      .from("product_variants")
      .select("id, sku, size, color, price_override, product_id")
      .in("product_id", [...productMap.keys()])
      .limit(60);
    if (error) throw fromPostgrestError(error);
    productVariants = data;
  }

  // Merge with SKU matches (dedupe by variant id).
  const variantsById = new Map<string, (typeof productVariants)[number]>();
  for (const variant of [...productVariants, ...skuResult.data]) {
    variantsById.set(variant.id, variant);
  }
  const variants = [...variantsById.values()];
  if (variants.length === 0) return [];

  // Resolve titles/prices for SKU-matched products not already loaded.
  const missingProductIds = [
    ...new Set(
      variants.map((v) => v.product_id).filter((id) => !productMap.has(id)),
    ),
  ];
  if (missingProductIds.length > 0) {
    const { data, error } = await db
      .from("products")
      .select("id, title, base_price")
      .in("id", missingProductIds)
      .is("archived_at", null);
    if (error) throw fromPostgrestError(error);
    for (const product of data) productMap.set(product.id, product);
  }

  // Inventory for availability.
  const { data: inventory, error: inventoryError } = await db
    .from("inventory")
    .select("variant_id, quantity, reserved_quantity")
    .in(
      "variant_id",
      variants.map((v) => v.id),
    );
  if (inventoryError) throw fromPostgrestError(inventoryError);
  const stock = new Map(
    inventory.map((row) => [
      row.variant_id,
      row.quantity - row.reserved_quantity,
    ]),
  );

  const items: PosSearchItem[] = [];
  for (const variant of variants) {
    const product = productMap.get(variant.product_id);
    if (!product) continue; // archived / not sellable
    items.push({
      variantId: variant.id,
      productId: variant.product_id,
      productTitle: product.title,
      variantLabel: variantLabel(variant.size, variant.color),
      sku: variant.sku,
      unitPrice: variant.price_override ?? product.base_price,
      available: stock.get(variant.id) ?? 0,
    });
  }
  return items
    .sort((a, b) => a.productTitle.localeCompare(b.productTitle))
    .slice(0, 20);
}

/** Search existing customers to attach to a POS sale. */
export async function searchCustomers(term: string): Promise<PosCustomer[]> {
  const query = term.trim();
  if (!query) return [];
  const db = createAdminClient();
  const escaped = query.replace(/[%,]/g, "");

  const { data, error } = await db
    .from("customers")
    .select("id, name, email, phone")
    .or(
      `name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    )
    .order("name", { ascending: true, nullsFirst: false })
    .limit(8);
  if (error) throw fromPostgrestError(error);
  return data;
}
