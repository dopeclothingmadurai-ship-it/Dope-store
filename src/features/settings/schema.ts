import { z } from "zod";

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .or(z.literal("").transform(() => null));

export const storeProfileSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required").max(120),
  supportEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .nullable()
    .or(z.literal("").transform(() => null)),
  supportPhone: nullableText(30),
  gstNumber: nullableText(30),
  address: z.object({
    line1: nullableText(160),
    line2: nullableText(160),
    city: nullableText(80),
    state: nullableText(80),
    pincode: nullableText(20),
    country: nullableText(80),
  }),
  currency: z.string().trim().min(1).max(8),
  timezone: z.string().trim().min(1).max(64),
  logoUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const taxShippingSchema = z.object({
  taxRateBps: z.coerce.number().int().min(0).max(10000),
  shippingFlat: z.coerce.number().int().min(0),
  freeShippingThreshold: z.coerce.number().int().min(0).nullable(),
});

export const paymentsSchema = z.object({
  razorpayKeyId: nullableText(120),
});

export const maintenanceSchema = z.object({
  maintenanceMode: z.boolean(),
});

export const staffRoleSchema = z.enum(["owner", "manager", "editor", "staff"]);

export const passwordChangeSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

export type StoreProfileValues = z.infer<typeof storeProfileSchema>;
export type TaxShippingValues = z.infer<typeof taxShippingSchema>;
export type PaymentsValues = z.infer<typeof paymentsSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
