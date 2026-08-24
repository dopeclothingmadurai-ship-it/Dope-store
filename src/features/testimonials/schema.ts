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
  status: z.enum(["pending", "approved", "rejected"]),
  position: z.coerce.number().int().min(0).max(9999),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export const testimonialStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);
export type TestimonialStatus = z.infer<typeof testimonialStatusSchema>;

/** Public customer submission — a tightly-scoped subset (no status/featured). */
export const customerTestimonialSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Please add your name")
    .max(80, "Name is too long"),
  review: z
    .string()
    .trim()
    .min(10, "Tell us a little more")
    .max(1000, "Keep it under 1000 characters"),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  location: z
    .string()
    .trim()
    .max(80, "Too long")
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export type CustomerTestimonialValues = z.infer<
  typeof customerTestimonialSchema
>;
