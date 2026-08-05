/**
 * Absolute base URL for the storefront, used for metadataBase, canonical URLs,
 * Open Graph, the sitemap and robots. Resolves without any required env var:
 * an explicit NEXT_PUBLIC_SITE_URL wins, then Vercel's deployment URL, then a
 * local dev fallback. Set NEXT_PUBLIC_SITE_URL in production for canonical URLs.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const SITE_NAME = "Dope Store";
