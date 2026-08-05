import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type TestimonialFormValues } from "./schema";
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

/** Toggle published/hidden without opening the full editor. */
export async function setTestimonialStatus(
  id: string,
  status: "published" | "hidden",
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
