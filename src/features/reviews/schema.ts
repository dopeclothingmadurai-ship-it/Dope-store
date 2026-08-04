import { z } from "zod";

/** Max images a customer may attach to a single review. */
export const MAX_REVIEW_IMAGES = 4;

/** Customer review submission — rating + text. Images are handled separately. */
export const reviewSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  rating: z.coerce
    .number()
    .int("Choose a rating")
    .min(1, "Choose a rating")
    .max(5, "Choose a rating"),
  body: z
    .string()
    .trim()
    .min(1, "Write a short review")
    .max(2000, "Keep it under 2000 characters"),
});

export type ReviewValues = z.infer<typeof reviewSchema>;
