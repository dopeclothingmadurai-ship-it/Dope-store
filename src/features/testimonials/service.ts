import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type CustomerTestimonialValues,
  type TestimonialFormValues,
  type TestimonialStatus,
} from "./schema";
import { type Testimonial } from "./types";

function toRow(input: TestimonialFormValues) {
  return {
    customer_name: input.customerName.trim(),
    review: input.review.trim(),
    rating: input.rating,
    location: input.location?.trim() ? input.location.trim() : null,
    avatar_url: input.avatarUrl?.trim() ? input.avatarUrl.trim() : null,
    verified_purchase: input.verifiedPurchase,
    featured: input.featured,
    status: input.status,
    position: input.position,
  };
}

export async function createTestimonial(
  input: TestimonialFormValues,
): Promise<Testimonial> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("testimonials")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateTestimonial(
  id: string,
  input: TestimonialFormValues,
): Promise<Testimonial> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("testimonials")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Set the moderation status (approve / reject / reset to pending). */
export async function setTestimonialStatus(
  id: string,
  status: TestimonialStatus,
): Promise<Testimonial> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("testimonials")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function deleteTestimonial(id: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from("testimonials").delete().eq("id", id);
  if (error) throw fromPostgrestError(error);
}

/** Persist a new manual order (list of ids in the desired sequence). */
export async function reorderTestimonials(ids: string[]): Promise<void> {
  const db = createAdminClient();
  await Promise.all(
    ids.map((id, index) =>
      db.from("testimonials").update({ position: index }).eq("id", id),
    ),
  );
}

/**
 * A signed-in customer's own submission. Always stored as `pending` and tagged
 * as a customer submission — never featured, never auto-approved. One
 * submission per customer: an existing pending/approved/rejected row is
 * updated back to pending rather than creating duplicates.
 */
export async function submitCustomerTestimonial(params: {
  userId: string;
  input: CustomerTestimonialValues;
}): Promise<Testimonial> {
  const db = createAdminClient();
  const row = {
    user_id: params.userId,
    submitted_by_customer: true,
    customer_name: params.input.customerName.trim(),
    review: params.input.review.trim(),
    rating: params.input.rating,
    location: params.input.location?.trim() ? params.input.location.trim() : null,
    status: "pending" as const,
    featured: false,
    verified_purchase: false,
  };

  const { data: existing, error: findError } = await db
    .from("testimonials")
    .select("id")
    .eq("user_id", params.userId)
    .eq("submitted_by_customer", true)
    .maybeSingle();
  if (findError) throw fromPostgrestError(findError);

  if (existing) {
    const { data, error } = await db
      .from("testimonials")
      .update(row)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw fromPostgrestError(error);
    return data;
  }

  const { data, error } = await db
    .from("testimonials")
    .insert(row)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}
