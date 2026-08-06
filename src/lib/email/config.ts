import "server-only";

import { serverEnv } from "@/lib/env/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Central email configuration.
 *
 * Required environment variables (add these to `.env.local`, then everything
 * works with no further code changes):
 *
 *   RESEND_API_KEY   Your Resend API key (https://resend.com/api-keys).
 *   EMAIL_FROM       Verified sender, e.g. "Dope Store <orders@yourdomain.com>".
 *   EMAIL_REPLY_TO   Where customer replies go, e.g. "support@yourdomain.com".
 *
 * All three are optional at build/run time — when RESEND_API_KEY is missing the
 * email layer no-ops (and logs), so checkout is never blocked by email config.
 */
export const emailConfig = {
  /** True only when a Resend key is present — the send layer checks this. */
  enabled: Boolean(serverEnv.RESEND_API_KEY),
  apiKey: serverEnv.RESEND_API_KEY,
  from: serverEnv.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`,
  replyTo: serverEnv.EMAIL_REPLY_TO,
} as const;

/**
 * Brand + store details used inside email templates. Kept here (not hard-coded
 * in the template) so they are easy to update in one place.
 */
export const storeInfo = {
  name: SITE_NAME,
  url: SITE_URL,
  supportEmail: serverEnv.EMAIL_REPLY_TO ?? "support@dopestore.example",
  pickupInstructions:
    "Once your order has been confirmed, you can collect it from the nearest Dope Store by showing your Order Number or Order Confirmation Email.",
} as const;
