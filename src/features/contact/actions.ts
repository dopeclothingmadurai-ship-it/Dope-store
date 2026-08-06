"use server";

import { z } from "zod";

import { fromPostgrestError, runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  subject: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || null),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message is too long"),
});

/** Store a contact-form submission (public). Staff read them in Supabase. */
export async function submitContactAction(
  input: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const values = contactSchema.parse(input);
    const db = createAdminClient();
    const { error } = await db.from("contact_messages").insert({
      name: values.name,
      email: values.email.toLowerCase(),
      subject: values.subject,
      message: values.message,
    });
    if (error) throw fromPostgrestError(error);
    return null;
  });
}
