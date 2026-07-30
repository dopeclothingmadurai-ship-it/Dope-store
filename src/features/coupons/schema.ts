import { z } from "zod";

/** Optional ISO datetime coming from a datetime-local input (or null/empty). */
const optionalDateTime = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (value) => value === null || !Number.isNaN(new Date(value).getTime()),
    "Enter a valid date",
  );

const optionalPositiveInt = z.coerce
  .number()
  .int("Must be a whole number")
  .positive("Must be greater than zero")
  .nullable();

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(40, "Code is too long")
      .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers and dashes"),
    description: z
      .string()
      .trim()
      .max(200, "Description is too long")
      .nullable(),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce
      .number()
      .int("Must be a whole number")
      .positive("Must be greater than zero"),
    minOrder: z.coerce.number().int().min(0, "Cannot be negative"),
    maxDiscount: z.coerce
      .number()
      .int()
      .min(0, "Cannot be negative")
      .nullable(),
    usageLimit: optionalPositiveInt,
    perCustomerLimit: optionalPositiveInt,
    startsAt: optionalDateTime,
    endsAt: optionalDateTime,
  })
  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    path: ["value"],
    message: "Percentage cannot exceed 100",
  })
  .refine(
    (data) =>
      !data.startsAt ||
      !data.endsAt ||
      new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime(),
    { path: ["endsAt"], message: "End date must be after the start date" },
  );

export type CouponFormValues = z.infer<typeof couponFormSchema>;
