import { type StoreHomepageContent } from "./types";

/** Fallback announcement lines — mirror the original hardcoded storefront copy. */
export const DEFAULT_ANNOUNCEMENTS = [
  "Complimentary shipping over ₹2,000",
  "Autumn — Winter 26",
  "Crafted to last",
  "Made in India",
];

/**
 * The ultimate fallback content. Used when the singleton row is missing or a
 * query fails, so the storefront can never crash on absent content.
 */
export const DEFAULT_HOMEPAGE_CONTENT: StoreHomepageContent = {
  hero: {
    enabled: true,
    images: [],
    tagline: "A NEW CULTURE IS HERE",
    ctaLabel: "Wear the Culture",
    ctaHref: "/shop",
  },
  banner: {
    enabled: false,
    text: "PRIVATE DROP",
    offerText: "Members unlock early access",
    countdownEnabled: false,
    countdownEndsAt: null,
    speed: 26,
    direction: "left",
  },
  announcement: {
    enabled: true,
    messages: DEFAULT_ANNOUNCEMENTS,
    speed: 24,
    direction: "left",
  },
};
