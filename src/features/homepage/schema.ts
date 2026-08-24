import { z } from "zod";

export const heroSchema = z.object({
  heroEnabled: z.boolean(),
  // Ordered hero images (public URLs). A generous cap prevents abuse without
  // imposing an arbitrary small limit.
  heroImages: z
    .array(z.string().trim().min(1).max(1000))
    .max(24, "Up to 24 hero images"),
  heroTagline: z
    .string()
    .trim()
    .min(1, "Tagline is required")
    .max(120, "Keep the tagline under 120 characters"),
  heroCtaLabel: z
    .string()
    .trim()
    .min(1, "CTA label is required")
    .max(40, "Keep the label short"),
  heroCtaHref: z
    .string()
    .trim()
    .min(1, "CTA link is required")
    .max(200)
    .refine(
      (value) => value.startsWith("/") || /^https?:\/\//.test(value),
      "Use a path like /shop or a full URL",
    ),
});

export const promoBannerSchema = z
  .object({
    bannerEnabled: z.boolean(),
    bannerText: z.string().trim().max(80).default(""),
    bannerOfferText: z.string().trim().max(120).default(""),
    bannerCountdownEnabled: z.boolean(),
    bannerCountdownEndsAt: z
      .string()
      .trim()
      .nullable()
      .or(z.literal("").transform(() => null)),
    bannerSpeed: z.coerce
      .number()
      .int()
      .min(4, "Too fast")
      .max(120, "Too slow"),
    bannerDirection: z.enum(["left", "right"]),
  })
  .refine(
    (data) =>
      !data.bannerCountdownEnabled || Boolean(data.bannerCountdownEndsAt),
    {
      path: ["bannerCountdownEndsAt"],
      message: "Set an end date/time for the countdown",
    },
  )
  .refine((data) => !data.bannerEnabled || Boolean(data.bannerText.trim()), {
    path: ["bannerText"],
    message: "Add banner text",
  });

export const announcementSchema = z.object({
  announcementEnabled: z.boolean(),
  announcementMessages: z
    .array(z.string().trim().min(1).max(80))
    .max(12, "Up to 12 messages"),
  announcementSpeed: z.coerce.number().int().min(4).max(120),
  announcementDirection: z.enum(["left", "right"]),
});

export type HeroValues = z.infer<typeof heroSchema>;
export type PromoBannerValues = z.infer<typeof promoBannerSchema>;
export type AnnouncementValues = z.infer<typeof announcementSchema>;
