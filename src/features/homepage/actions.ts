"use server";

import { revalidatePath } from "next/cache";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";

import { announcementSchema, heroSchema, promoBannerSchema } from "./schema";
import * as service from "./service";
import { type HomepageContent } from "./types";

const ADMIN_PATH = "/admin/content";

/** Revalidate the admin editor and the whole storefront (header + homepage). */
function revalidate() {
  revalidatePath(ADMIN_PATH);
  revalidatePath("/", "layout");
}

export async function updateHeroAction(
  input: unknown,
): Promise<Result<HomepageContent>> {
  return runStaffAction(async () => {
    const values = heroSchema.parse(input);
    const content = await service.updateHero(values);
    revalidate();
    return content;
  });
}

export async function updatePromoBannerAction(
  input: unknown,
): Promise<Result<HomepageContent>> {
  return runStaffAction(async () => {
    const values = promoBannerSchema.parse(input);
    const content = await service.updatePromoBanner(values);
    revalidate();
    return content;
  });
}

export async function updateAnnouncementAction(
  input: unknown,
): Promise<Result<HomepageContent>> {
  return runStaffAction(async () => {
    const values = announcementSchema.parse(input);
    const content = await service.updateAnnouncement(values);
    revalidate();
    return content;
  });
}
