"use server";

import { revalidatePath } from "next/cache";

import { requireCustomer } from "@/lib/auth/customer";
import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";

import { reviewSchema } from "./schema";
import { submitReview } from "./service";
import { type ProductReview } from "./types";

/**
 * Submit (or update) the signed-in customer's review for a product, including
 * any attached photos. The customer must be authenticated and must have
 * purchased the product; both are enforced server-side. The payload is FormData
 * so image files can ride along. `productSlug` is used only to revalidate.
 */
export async function submitReviewAction(
  formData: FormData,
  productSlug: string,
): Promise<Result<ProductReview>> {
  return runAction(async () => {
    const customer = await requireCustomer();

    const { productId, rating, body } = reviewSchema.parse({
      productId: formData.get("productId"),
      rating: formData.get("rating"),
      body: formData.get("body"),
    });

    const keptImageUrls = formData
      .getAll("keptImageUrls")
      .map((value) => String(value));
    const newImages = formData
      .getAll("images")
      .filter(
        (value): value is File => value instanceof File && value.size > 0,
      );

    const review = await submitReview({
      email: customer.email,
      authorName: customer.name,
      productId,
      rating,
      body,
      keptImageUrls,
      newImages,
    });

    revalidatePath(`/product/${productSlug}`);
    revalidatePath("/");
    return review;
  });
}
