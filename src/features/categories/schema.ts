import { z } from "zod";

import { positionSchema, slugSchema } from "@/lib/validation/common";

/** Shared category form schema — used by the client form and the server action. */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  slug: slugSchema,
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long")
    .nullable(),
  imageUrl: z.string().url("Enter a valid image URL").nullable(),
  position: positionSchema,
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
