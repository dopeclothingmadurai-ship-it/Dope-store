import { z } from "zod";

import { uuidSchema } from "@/lib/validation/common";

export const posOrderSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: uuidSchema,
        quantity: z.coerce.number().int().min(1).max(999),
      }),
    )
    .min(1, "Add at least one item"),
  customer: z
    .object({
      id: uuidSchema.nullable(),
      name: z.string().trim().max(120).nullable(),
      email: z
        .string()
        .trim()
        .email("Enter a valid email")
        .nullable()
        .or(z.literal("").transform(() => null)),
      phone: z.string().trim().max(20).nullable(),
    })
    .nullable(),
  couponCode: z.string().trim().max(40).nullable(),
  manualDiscount: z.coerce.number().int().min(0), // paise
  tax: z.coerce.number().int().min(0), // paise
  shipping: z.coerce.number().int().min(0), // paise
  paymentMethod: z.enum(["cash", "upi", "card"]),
  note: z.string().trim().max(2000).nullable(),
});

export type PosOrderValues = z.infer<typeof posOrderSchema>;
