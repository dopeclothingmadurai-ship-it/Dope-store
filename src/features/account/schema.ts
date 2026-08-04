import { z } from "zod";

/** Customer sign-in — email + password. */
export const customerLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type CustomerLoginValues = z.infer<typeof customerLoginSchema>;

/** Customer registration. Password bounded to bcrypt's 72-byte input limit. */
export const customerRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(72, "Use at most 72 characters"),
});

export type CustomerRegisterValues = z.infer<typeof customerRegisterSchema>;
