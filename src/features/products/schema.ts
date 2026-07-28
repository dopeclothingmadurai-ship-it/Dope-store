import { z } from "zod";

import { slugSchema } from "@/lib/validation/common";

/** Integer paise, provided as a number by the price inputs (never a float). */
const paise = z
  .number({ message: "Enter a valid amount" })
  .int("Enter a whole amount")
  .min(0, "Cannot be negative");

const nullableText = (max: number) =>
  z.string().trim().max(max, "Too long").nullable();

/** Core product fields. Media, variants and inventory are managed separately. */
export const productFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Too long"),
  slug: slugSchema,
  description: nullableText(8000),
  brand: nullableText(120),
  categoryId: z.string().uuid().nullable(),
  status: z.enum(["draft", "active"]),
  seoTitle: nullableText(200),
  seoDescription: nullableText(400),
  basePrice: paise,
  compareAtPrice: paise.nullable(),
  featured: z.boolean(),
  tags: z.array(z.string().trim().min(1).max(40)).max(30, "Too many tags"),
  collectionIds: z.array(z.string().uuid()),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/** A single product variant. `id` is null for a not-yet-created variant. */
export const variantFormSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required").max(80, "Too long"),
  barcode: nullableText(80),
  size: nullableText(60),
  color: nullableText(60),
  priceOverride: paise.nullable(),
  weightGrams: z
    .number()
    .int("Enter a whole number of grams")
    .min(0, "Cannot be negative")
    .nullable(),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

/** Inventory adjustment — always applied through `adjust_inventory()`. */
export const inventoryAdjustSchema = z.object({
  delta: z
    .number({ message: "Enter an amount" })
    .int("Enter a whole number")
    .refine((value) => value !== 0, "Enter a non-zero amount"),
  reason: z.enum(["restock", "manual_adjustment", "correction", "return"]),
  reference: z.string().trim().max(200).nullable(),
});

export type InventoryAdjustValues = z.infer<typeof inventoryAdjustSchema>;

/** Attach an already-uploaded image to a product. */
export const productMediaSchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().max(200).nullable(),
});

export type ProductMediaValues = z.infer<typeof productMediaSchema>;
