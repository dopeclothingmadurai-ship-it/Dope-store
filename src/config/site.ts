import { clientEnv } from "@/lib/env/client";

/**
 * Static, app-wide configuration. Values that change per environment come from
 * validated env; values that are product constants live here.
 */
export const siteConfig = {
  name: "Dope Store",
  shortName: "Dope",
  description: "Premium fashion, curated.",
  /** Absolute public base URL — used for OG tags, emails, sitemap, webhooks. */
  url: clientEnv.NEXT_PUBLIC_SITE_URL,
  /** All monetary amounts are stored as integer paise and formatted as INR. */
  currency: "INR",
  currencyLocale: "en-IN",
} as const;

export type SiteConfig = typeof siteConfig;
