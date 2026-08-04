import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type ProductReview, type ReviewSummary } from "./types";

type Db = ReturnType<typeof createAdminClient>;

function mapReview(row: {
  id: string;
  author_name: string;
  rating: number;
  body: string;
  image_urls: string[];
  created_at: string;
}): ProductReview {
  return {
    id: row.id,
    authorName: row.author_name,
    rating: row.rating,
    body: row.body,
    imageUrls: row.image_urls,
    createdAt: row.created_at,
  };
}

/** Published reviews for a product, newest first (includes any images). */
export async function listProductReviews(
  productId: string,
): Promise<ProductReview[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("reviews")
    .select("id, author_name, rating, body, image_urls, created_at")
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data.map(mapReview);
}

/** Count + average rating across a product's published reviews. */
export async function getReviewSummary(
  productId: string,
): Promise<ReviewSummary> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "published");
  if (error) throw fromPostgrestError(error);
  if (data.length === 0) return { count: 0, average: 0 };
  const total = data.reduce((sum, row) => sum + row.rating, 0);
  return {
    count: data.length,
    average: Math.round((total / data.length) * 10) / 10,
  };
}

/** The CRM customer id for an email, or null if they have no record yet. */
async function resolveCustomerId(
  db: Db,
  email: string,
): Promise<string | null> {
  const { data, error } = await db
    .from("customers")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data?.id ?? null;
}

/**
 * Whether a customer (by email) has an order containing the given product.
 * Orders are staff-RLS-only, so this runs through the service-role client
 * after the caller has been authenticated as the owning customer.
 */
export async function hasPurchasedProduct(
  email: string,
  productId: string,
): Promise<boolean> {
  const db = createAdminClient();
  const customerId = await resolveCustomerId(db, email);
  if (!customerId) return false;

  const { data: orders, error: ordersError } = await db
    .from("orders")
    .select("id")
    .eq("customer_id", customerId);
  if (ordersError) throw fromPostgrestError(ordersError);
  if (orders.length === 0) return false;

  const { count, error } = await db
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .in(
      "order_id",
      orders.map((order) => order.id),
    );
  if (error) throw fromPostgrestError(error);
  return (count ?? 0) > 0;
}

/** A customer's existing review for a product, if any. */
export async function getCustomerReview(
  email: string,
  productId: string,
): Promise<ProductReview | null> {
  const db = createAdminClient();
  const customerId = await resolveCustomerId(db, email);
  if (!customerId) return null;

  const { data, error } = await db
    .from("reviews")
    .select("id, author_name, rating, body, image_urls, created_at")
    .eq("customer_id", customerId)
    .eq("product_id", productId)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data ? mapReview(data) : null;
}
