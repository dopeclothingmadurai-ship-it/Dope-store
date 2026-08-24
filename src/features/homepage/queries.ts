import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { DEFAULT_ANNOUNCEMENTS, DEFAULT_HOMEPAGE_CONTENT } from "./defaults";
import {
  type HomepageContent,
  type MarqueeDirection,
  type StoreHomepageContent,
} from "./types";

/** Coerce a jsonb value into a clean list of non-empty strings. */
function toMessages(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_ANNOUNCEMENTS;
  const messages = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return messages.length > 0 ? messages : DEFAULT_ANNOUNCEMENTS;
}

function toDirection(value: string): MarqueeDirection {
  return value === "right" ? "right" : "left";
}

/** Coerce the hero_images jsonb into a clean list of non-empty URL strings. */
function toImages(value: unknown, fallback: string | null): string[] {
  const list = Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  if (list.length > 0) return list;
  return fallback && fallback.trim() ? [fallback.trim()] : [];
}

/**
 * The raw singleton row for the admin editor. The row is seeded by the
 * migration, but if it is somehow missing we surface `null` so the caller can
 * decide (the admin page renders defaults from `DEFAULT_HOMEPAGE_CONTENT`).
 */
export async function getHomepageContentRow(): Promise<HomepageContent | null> {
  const db = createAdminClient();
  const { data } = await db
    .from("homepage_content")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return data ?? null;
}

/**
 * The raw row for the admin editor, synthesizing a default row from
 * `DEFAULT_HOMEPAGE_CONTENT` if the seed row is missing, so the editor always
 * has editable content.
 */
export async function getHomepageContentRowForAdmin(): Promise<HomepageContent> {
  const row = await getHomepageContentRow();
  if (row) return row;

  const d = DEFAULT_HOMEPAGE_CONTENT;
  return {
    id: true,
    hero_enabled: d.hero.enabled,
    hero_image_url: d.hero.images[0] ?? null,
    hero_images: d.hero.images,
    hero_tagline: d.hero.tagline,
    hero_cta_label: d.hero.ctaLabel,
    hero_cta_href: d.hero.ctaHref,
    banner_enabled: d.banner.enabled,
    banner_text: d.banner.text,
    banner_offer_text: d.banner.offerText,
    banner_countdown_enabled: d.banner.countdownEnabled,
    banner_countdown_ends_at: d.banner.countdownEndsAt,
    banner_speed: d.banner.speed,
    banner_direction: d.banner.direction,
    announcement_enabled: d.announcement.enabled,
    announcement_messages: d.announcement.messages,
    announcement_speed: d.announcement.speed,
    announcement_direction: d.announcement.direction,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Normalized homepage content for the storefront. Never throws — on any error
 * or missing row it returns `DEFAULT_HOMEPAGE_CONTENT`, so a page can always
 * render.
 */
export async function getStoreHomepageContent(): Promise<StoreHomepageContent> {
  try {
    const row = await getHomepageContentRow();
    if (!row) return DEFAULT_HOMEPAGE_CONTENT;

    return {
      hero: {
        enabled: row.hero_enabled,
        images: toImages(row.hero_images, row.hero_image_url),
        tagline: row.hero_tagline?.trim() || DEFAULT_HOMEPAGE_CONTENT.hero.tagline,
        ctaLabel:
          row.hero_cta_label?.trim() || DEFAULT_HOMEPAGE_CONTENT.hero.ctaLabel,
        ctaHref:
          row.hero_cta_href?.trim() || DEFAULT_HOMEPAGE_CONTENT.hero.ctaHref,
      },
      banner: {
        enabled: row.banner_enabled,
        text: row.banner_text ?? "",
        offerText: row.banner_offer_text ?? "",
        countdownEnabled: row.banner_countdown_enabled,
        countdownEndsAt: row.banner_countdown_ends_at,
        speed: row.banner_speed,
        direction: toDirection(row.banner_direction),
      },
      announcement: {
        enabled: row.announcement_enabled,
        messages: toMessages(row.announcement_messages),
        speed: row.announcement_speed,
        direction: toDirection(row.announcement_direction),
      },
    };
  } catch {
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}
