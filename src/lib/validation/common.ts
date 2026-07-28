import { z } from "zod";

/** Matches the Postgres `slug` domain: lowercase alphanumerics and hyphens. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(140, "Slug is too long")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and hyphens only",
  );

/** An integer money amount in paise (never floats). */
export const paiseSchema = z.coerce
  .number({ message: "Enter an amount" })
  .int("Enter a whole amount")
  .min(0, "Cannot be negative");

/** A non-negative ordering position. */
export const positionSchema = z.coerce.number().int().min(0);

/** A UUID identifier. */
export const uuidSchema = z.string().uuid("Invalid identifier");
