import { z } from "zod";

import { slugSchema, uuidSchema } from "@/lib/validation/common";

/** Shared collection form schema — used by the client form and server action. */
export const collectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  slug: slugSchema,
  type: z.enum(["manual", "automated"]),
  isFeatured: z.boolean(),
});

export type CollectionFormValues = z.infer<typeof collectionFormSchema>;

/** Ordered product assignment for a collection. */
export const collectionProductsSchema = z.object({
  productIds: z.array(uuidSchema),
});

export type CollectionProductsValues = z.infer<typeof collectionProductsSchema>;
