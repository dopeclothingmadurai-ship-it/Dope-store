import { z } from "zod";

/** A cart line as sent by the client — price is always recomputed server-side. */
export const checkoutItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
});

export const checkoutAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  line1: z.string().trim().min(1, "Address is required").max(160),
  line2: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((value) => value || null),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().min(1, "State is required").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
});

export const checkoutContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,20}$/, "Enter a valid phone number"),
});

export const checkoutSchema = z
  .object({
    items: z.array(checkoutItemSchema).min(1, "Your bag is empty"),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    contact: checkoutContactSchema,
    address: checkoutAddressSchema.nullable(),
    couponCode: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((value) => value || null),
  })
  .refine(
    (data) => data.fulfillmentType === "pickup" || data.address !== null,
    {
      message: "A delivery address is required",
      path: ["address"],
    },
  );

export type CheckoutValues = z.infer<typeof checkoutSchema>;
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;
export type CheckoutContact = z.infer<typeof checkoutContactSchema>;
