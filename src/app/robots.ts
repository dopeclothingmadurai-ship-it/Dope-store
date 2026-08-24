import { type MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** Allow crawling the storefront; keep the admin and API out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/account",
        "/login",
        "/checkout",
        "/auth",
        "/search",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
