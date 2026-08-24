import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { type TablesInsert } from "@/types/database";

import {
  type AnnouncementValues,
  type HeroValues,
  type PromoBannerValues,
} from "./schema";
import { type HomepageContent } from "./types";

/**
 * Update the singleton homepage_content row (pinned to id = true). Uses upsert
 * on the primary key so it is safe whether or not the seed row exists — and,
 * crucially, no `.eq()` is chained after `.upsert()` (that produced the save
 * error). `onConflict: "id"` updates the single row in place.
 */
async function patch(
  update: TablesInsert<"homepage_content">,
): Promise<HomepageContent> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("homepage_content")
    .upsert({ id: true, ...update }, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateHero(input: HeroValues): Promise<HomepageContent> {
  return patch({
    hero_enabled: input.heroEnabled,
    hero_images: input.heroImages,
    // Keep the legacy single column in sync (first image) for back-compat.
    hero_image_url: input.heroImages[0] ?? null,
    hero_tagline: input.heroTagline,
    hero_cta_label: input.heroCtaLabel,
    hero_cta_href: input.heroCtaHref,
  });
}

export async function updatePromoBanner(
  input: PromoBannerValues,
): Promise<HomepageContent> {
  return patch({
    banner_enabled: input.bannerEnabled,
    banner_text: input.bannerText,
    banner_offer_text: input.bannerOfferText,
    banner_countdown_enabled: input.bannerCountdownEnabled,
    banner_countdown_ends_at: input.bannerCountdownEndsAt,
    banner_speed: input.bannerSpeed,
    banner_direction: input.bannerDirection,
  });
}

export async function updateAnnouncement(
  input: AnnouncementValues,
): Promise<HomepageContent> {
  return patch({
    announcement_enabled: input.announcementEnabled,
    announcement_messages: input.announcementMessages,
    announcement_speed: input.announcementSpeed,
    announcement_direction: input.announcementDirection,
  });
}
