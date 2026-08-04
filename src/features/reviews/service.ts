import "server-only";

import {
  AppError,
  StorageError,
  ValidationError,
  fromPostgrestError,
} from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { hasPurchasedProduct } from "./queries";
import { MAX_REVIEW_IMAGES } from "./schema";
import { type ProductReview } from "./types";

type Db = ReturnType<typeof createAdminClient>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB per image

export type SubmitReviewInput = {
  email: string;
  authorName: string;
  productId: string;
  rating: number;
  body: string;
  /** Existing image URLs the customer chose to keep (edit mode). */
  keptImageUrls: string[];
  /** Newly attached image files to upload. */
  newImages: File[];
};

/** Upload review photos to the public `review-media` bucket; returns their URLs. */
async function uploadReviewImages(
  db: Db,
  productId: string,
  customerId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      throw new ValidationError("Only image files can be attached.");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ValidationError("Each image must be under 5MB.");
    }
    const ext =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${productId}/${customerId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from("review-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new StorageError("Could not upload your image.");
    urls.push(
      db.storage.from("review-media").getPublicUrl(path).data.publicUrl,
    );
  }
  return urls;
}

/**
 * Create or update a customer's review for a product they have purchased.
 *
 * Runs with the service-role client after the caller is authenticated as the
 * customer (see the action). Enforces the purchase requirement here too, so the
 * rule lives in trusted server code rather than in RLS. A customer has at most
 * one review per product — a repeat submission edits the existing one. Attached
 * images are stored on the review and shown on the product page only.
 */
export async function submitReview(
  input: SubmitReviewInput,
): Promise<ProductReview> {
  const db = createAdminClient();
  const email = input.email.toLowerCase();

  if (input.keptImageUrls.length + input.newImages.length > MAX_REVIEW_IMAGES) {
    throw new ValidationError(
      `You can attach up to ${MAX_REVIEW_IMAGES} images.`,
    );
  }

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

  const uploaded = await uploadReviewImages(
    db,
    input.productId,
    customer.id,
    input.newImages,
  );
  const imageUrls = [...input.keptImageUrls, ...uploaded].slice(
    0,
    MAX_REVIEW_IMAGES,
  );

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
    image_urls: imageUrls,
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
