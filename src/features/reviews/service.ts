import "server-only";

import { AppError, ValidationError, fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { hasPurchasedProduct } from "./queries";
import { type ProductReview } from "./types";

export type SubmitReviewInput = {
  email: string;
  authorName: string;
  productId: string;
  rating: number;
  body: string;
};

/**
 * Create or update a customer's review for a product they have purchased.
 *
 * Runs with the service-role client after the caller is authenticated as the
 * customer (see the action). Enforces the purchase requirement here too, so the
 * rule lives in trusted server code rather than in RLS. A customer has at most
 * one review per product — a repeat submission edits the existing one.
 */
export async function submitReview(
  input: SubmitReviewInput,
): Promise<ProductReview> {
  const db = createAdminClient();
  const email = input.email.toLowerCase();

  const purchased = await hasPurchasedProduct(email, input.productId);
  if (!purchased) {
    throw new ValidationError(
      "You can review this product once you've purchased it.",
    );
  }

  const { data: customer, error: customerError } = await db
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (customerError) throw fromPostgrestError(customerError);
  if (!customer) {
    // A purchaser always has a CRM row; this is a safety net.
    throw new AppError("not_found", "We couldn't find your customer record.");
  }

  const { data: existing, error: existingError } = await db
    .from("reviews")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("product_id", input.productId)
    .maybeSingle();
  if (existingError) throw fromPostgrestError(existingError);

  const fields = {
    product_id: input.productId,
    customer_id: customer.id,
    author_name: input.authorName.trim(),
    rating: input.rating,
    body: input.body.trim(),
    status: "published",
  };

  const query = existing
    ? db.from("reviews").update(fields).eq("id", existing.id)
    : db.from("reviews").insert(fields);

  const { data, error } = await query
    .select("id, author_name, rating, body, image_urls, created_at")
    .single();
  if (error) throw fromPostgrestError(error);

  return {
    id: data.id,
    authorName: data.author_name,
    rating: data.rating,
    body: data.body,
    imageUrls: data.image_urls,
    createdAt: data.created_at,
  };
}
