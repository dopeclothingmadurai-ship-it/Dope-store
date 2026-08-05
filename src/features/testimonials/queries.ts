import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type StoreTestimonial, type Testimonial } from "./types";

/** All testimonials for the admin, in display order. */
export async function listTestimonials(): Promise<Testimonial[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("testimonials")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw fromPostgrestError(error);
  return data;
}

/**
 * Published testimonials for the storefront — featured first, then manual
 * order, then newest. Only safe display fields are returned.
 */
export async function listPublishedTestimonials(
  limit = 12,
): Promise<StoreTestimonial[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("testimonials")
    .select(
      "id, customer_name, review, rating, location, avatar_url, verified_purchase",
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw fromPostgrestError(error);
  return data.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    review: row.review,
    rating: row.rating,
    location: row.location,
    avatarUrl: row.avatar_url,
    verifiedPurchase: row.verified_purchase,
  }));
}
