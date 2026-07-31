import { z } from "zod";

import { uuidSchema } from "@/lib/validation/common";

export const bulkIdsSchema = z
  .array(uuidSchema)
  .min(1, "Select products first");

export const bulkStatusSchema = z.enum(["draft", "active", "archived"]);

export const bulkPriceModeSchema = z.enum([
  "increase_pct",
  "decrease_pct",
  "increase_fixed",
  "decrease_fixed",
  "set_exact",
]);

export const bulkPriceSchema = z.object({
  mode: bulkPriceModeSchema,
  // Percent for the _pct modes; integer paise for fixed/exact.
  value: z.coerce.number().int().min(0),
});

export const bulkInventoryModeSchema = z.enum(["set", "increase", "decrease"]);

export const bulkInventorySchema = z.object({
  mode: bulkInventoryModeSchema,
  value: z.coerce.number().int().min(0).max(1_000_000),
});

export const bulkTagsSchema = z.object({
  tags: z.array(z.string().trim().min(1)).min(1, "Add at least one tag"),
  add: z.boolean(),
});

export const bulkBrandSchema = z.object({
  brand: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const bulkCategorySchema = z.object({
  categoryId: uuidSchema.nullable(),
});

export const bulkCollectionSchema = z.object({
  collectionId: uuidSchema,
});

export type BulkPriceMode = z.infer<typeof bulkPriceModeSchema>;
export type BulkInventoryMode = z.infer<typeof bulkInventoryModeSchema>;
export type BulkStatusValue = z.infer<typeof bulkStatusSchema>;
