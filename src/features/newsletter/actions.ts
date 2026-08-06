"use server";

import { z } from "zod";

import { fromPostgrestError, runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(320),
});

/**
 * Subscribe an email to the newsletter. Public (unauthenticated) action. A
 * duplicate is treated as success so we never reveal who is already subscribed.
 */
export async function subscribeNewsletterAction(
  input: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const { email } = newsletterSchema.parse(input);
    const db = createAdminClient();
    const { error } = await db
      .from("newsletter_subscribers")
      .insert({ email: email.toLowerCase() });
    if (error && error.code !== "23505") throw fromPostgrestError(error);
    return null;
  });
}
