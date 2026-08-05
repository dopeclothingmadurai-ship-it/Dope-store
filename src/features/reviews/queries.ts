import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type ProductReview,
  type ReviewEligibility,
  type ReviewSummary,
} from "./types";

type Db = ReturnType<typeof createAdminClient>;

const REVIEW_COLUMNS = "id, author_name, rating, body, image_urls, created_at";

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
    .select(REVIEW_COLUMNS)
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data.map(mapReview);
}

/**
 * Count + average across a set of already-fetched reviews. Pure — derived from
 * the list the page already loads, so it costs no extra query.
 */
export function summarizeReviews(reviews: ProductReview[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: 0 };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    count: reviews.length,
    average: Math.round((total / reviews.length) * 10) / 10,
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

/** Whether a resolved customer has an order containing the given product. */
async function customerOwnsProduct(
  db: Db,
  customerId: string,
  productId: string,
): Promise<boolean> {
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

/**
 * Whether a customer (by email) has purchased a product. Orders are
 * staff-RLS-only, so this runs through the service-role client after the caller
 * has been authenticated as the owning customer.
 */
export async function hasPurchasedProduct(
  email: string,
  productId: string,
): Promise<boolean> {
  const db = createAdminClient();
  const customerId = await resolveCustomerId(db, email);
  if (!customerId) return false;
  return customerOwnsProduct(db, customerId, productId);
}

/**
 * Everything the product page needs to render the review controls for a
 * signed-in customer: whether they purchased the product and their existing
 * review (for edit mode). Resolves the customer once and runs the two lookups
 * in parallel — no duplicate CRM query.
 */
export async function getReviewEligibility(
  email: string,
  productId: string,
): Promise<ReviewEligibility> {
  const db = createAdminClient();
  const customerId = await resolveCustomerId(db, email);
  if (!customerId) {
    return { signedIn: true, hasPurchased: false, existing: null };
  }

  const [hasPurchased, existingRow] = await Promise.all([
    customerOwnsProduct(db, customerId, productId),
    db
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("customer_id", customerId)
      .eq("product_id", productId)
      .maybeSingle(),
  ]);
  if (existingRow.error) throw fromPostgrestError(existingRow.error);

  return {
    signedIn: true,
    hasPurchased,
    existing: existingRow.data ? mapReview(existingRow.data) : null,
  };
}
