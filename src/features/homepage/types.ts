import { type Tables } from "@/types/database";

/** The raw singleton row (admin editing). */
export type HomepageContent = Tables<"homepage_content">;

export type MarqueeDirection = "left" | "right";

/** Normalized hero content for the storefront. */
export type StoreHero = {
  enabled: boolean;
  /** Ordered hero images (public URLs). May be empty → the hero falls back. */
  images: string[];
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
};

/** Normalized promotional banner content for the storefront. */
export type StorePromoBanner = {
  enabled: boolean;
  text: string;
  offerText: string;
  countdownEnabled: boolean;
  countdownEndsAt: string | null;
  speed: number;
  direction: MarqueeDirection;
};

/** Normalized top announcement marquee content. */
export type StoreAnnouncement = {
  enabled: boolean;
  messages: string[];
  speed: number;
  direction: MarqueeDirection;
};

export type StoreHomepageContent = {
  hero: StoreHero;
  banner: StorePromoBanner;
  announcement: StoreAnnouncement;
};

export type {
  HeroValues,
  PromoBannerValues,
  AnnouncementValues,
} from "./schema";
