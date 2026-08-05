import { z } from "zod";

// Optional text fields stay `string | null` (blank is normalized to null in the
// service) so the form's input and output types match — no resolver mismatch.
export const testimonialFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  review: z
    .string()
    .trim()
    .min(1, "Review is required")
    .max(1000, "Review is too long"),
  rating: z.coerce.number().int().min(1).max(5),
  location: z.string().trim().max(80, "Too long").nullable(),
  avatarUrl: z.string().trim().max(500, "Too long").nullable(),
  verifiedPurchase: z.boolean(),
  featured: z.boolean(),
  status: z.enum(["published", "hidden"]),
  position: z.coerce.number().int().min(0).max(9999),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;
