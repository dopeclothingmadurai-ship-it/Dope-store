"use server";

import { revalidatePath } from "next/cache";

import { requireCustomer } from "@/lib/auth/customer";
import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";

import { reviewSchema } from "./schema";
import { submitReview } from "./service";
import { type ProductReview } from "./types";

/**
 * Submit (or update) the signed-in customer's review for a product. The
 * customer must be authenticated and must have purchased the product; both are
 * enforced server-side. `productSlug` is only used to revalidate the page.
 */
export async function submitReviewAction(
  input: unknown,
  productSlug: string,
): Promise<Result<ProductReview>> {
  return runAction(async () => {
    const customer = await requireCustomer();
    const { productId, rating, body } = reviewSchema.parse(input);

    const review = await submitReview({
      email: customer.email,
      authorName: customer.name,
      productId,
      rating,
      body,
    });

    revalidatePath(`/product/${productSlug}`);
    revalidatePath("/");
    return review;
  });
}
