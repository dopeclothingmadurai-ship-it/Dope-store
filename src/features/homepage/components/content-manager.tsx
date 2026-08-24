"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  MessageSquareQuote,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
import { LinkButton } from "@/components/admin/link-button";
import { SectionCard } from "@/components/admin/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  updateAnnouncementAction,
  updateHeroAction,
  updatePromoBannerAction,
} from "../actions";
import { type HomepageContent } from "../types";
import { HeroImagesInput } from "./hero-images-input";

const fieldBox = cn(
  "border-input dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
);

/** Warn before leaving the page while a section has unsaved edits. */
function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

function DirtyBadge({ dirty }: { dirty: boolean }) {
  if (!dirty) return null;
  return (
    <span className="text-warning text-[11px] font-medium tracking-wide">
      Unsaved changes
    </span>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="border-input flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroForm({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const initial = useMemo(
    () => ({
      heroEnabled: content.hero_enabled,
      heroImages: Array.isArray(content.hero_images)
        ? content.hero_images.filter(
            (item): item is string => typeof item === "string",
          )
        : [],
      heroTagline: content.hero_tagline,
      heroCtaLabel: content.hero_cta_label,
      heroCtaHref: content.hero_cta_href,
    }),
    [content],
  );
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [initial]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedGuard(dirty);

  function set<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const result = await updateHeroAction(values);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Hero updated");
    router.refresh();
  }

  return (
    <SectionCard
      title="Hero"
      description="The homepage opening. Typography is fixed and premium — you edit the content."
      action={<DirtyBadge dirty={dirty} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <ToggleRow
            label="Show hero"
            hint="Hide to remove the hero from the homepage"
            checked={values.heroEnabled}
            onChange={(value) => set("heroEnabled", value)}
          />

          <FormRow
            label="Hero images"
            hint="Add several — the hero cycles through them as a campaign"
          >
            <HeroImagesInput
              value={values.heroImages}
              onChange={(images) => set("heroImages", images)}
            />
          </FormRow>

          <FormRow label="Tagline" htmlFor="hero-tagline" required>
            <Textarea
              id="hero-tagline"
              rows={2}
              maxLength={120}
              value={values.heroTagline}
              onChange={(event) => set("heroTagline", event.target.value)}
              placeholder="A NEW CULTURE IS HERE"
            />
          </FormRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="CTA label" htmlFor="hero-cta-label" required>
              <Input
                id="hero-cta-label"
                value={values.heroCtaLabel}
                onChange={(event) => set("heroCtaLabel", event.target.value)}
                placeholder="Wear the Culture"
              />
            </FormRow>
            <FormRow
              label="CTA link"
              htmlFor="hero-cta-href"
              required
              hint="A path like /shop or a full URL"
            >
              <Input
                id="hero-cta-href"
                value={values.heroCtaHref}
                onChange={(event) => set("heroCtaHref", event.target.value)}
                placeholder="/shop"
              />
            </FormRow>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">Preview</p>
          <div className="relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl border bg-black">
            {values.heroImages[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={values.heroImages[0]}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="relative p-4">
              <p className="font-editorial text-xl leading-[1.05] font-normal text-white">
                {values.heroTagline || "A NEW CULTURE IS HERE"}
              </p>
              <span className="mt-3 inline-block bg-white px-3 py-1.5 text-[10px] font-medium tracking-[0.2em] text-black uppercase">
                {values.heroCtaLabel || "Wear the Culture"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save hero"}
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Promotional banner ──────────────────────────────────────────────────────

/** ISO string <-> `datetime-local` input value (local time). */
function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
function localInputToIso(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function BannerForm({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const initial = useMemo(
    () => ({
      bannerEnabled: content.banner_enabled,
      bannerText: content.banner_text,
      bannerOfferText: content.banner_offer_text,
      bannerCountdownEnabled: content.banner_countdown_enabled,
      bannerCountdownEndsAt: isoToLocalInput(content.banner_countdown_ends_at),
      bannerSpeed: content.banner_speed,
      bannerDirection: content.banner_direction as "left" | "right",
    }),
    [content],
  );
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [initial]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedGuard(dirty);

  function set<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const result = await updatePromoBannerAction({
      ...values,
      bannerCountdownEndsAt: localInputToIso(values.bannerCountdownEndsAt),
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Banner updated");
    router.refresh();
  }

  return (
    <SectionCard
      title="Promotional banner"
      description="A cinematic marquee shown beneath the hero."
      action={<DirtyBadge dirty={dirty} />}
    >
      <div className="space-y-4">
        <ToggleRow
          label="Show banner"
          hint="Hide to remove the banner from the homepage"
          checked={values.bannerEnabled}
          onChange={(value) => set("bannerEnabled", value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormRow label="Banner text" htmlFor="banner-text">
            <Input
              id="banner-text"
              maxLength={80}
              value={values.bannerText}
              onChange={(event) => set("bannerText", event.target.value)}
              placeholder="PRIVATE DROP"
            />
          </FormRow>
          <FormRow label="Offer text" htmlFor="banner-offer">
            <Input
              id="banner-offer"
              maxLength={120}
              value={values.bannerOfferText}
              onChange={(event) => set("bannerOfferText", event.target.value)}
              placeholder="Members unlock early access"
            />
          </FormRow>
        </div>

        <ToggleRow
          label="Countdown"
          hint="Show a live countdown inside the banner"
          checked={values.bannerCountdownEnabled}
          onChange={(value) => set("bannerCountdownEnabled", value)}
        />

        {values.bannerCountdownEnabled ? (
          <FormRow label="Countdown ends at" htmlFor="banner-ends">
            <input
              id="banner-ends"
              type="datetime-local"
              className={fieldBox}
              value={values.bannerCountdownEndsAt}
              onChange={(event) =>
                set("bannerCountdownEndsAt", event.target.value)
              }
            />
          </FormRow>
        ) : null}

        {/* Static preview */}
        <div className="border-gold/15 flex items-center gap-5 overflow-hidden rounded-lg border bg-[#0c0c0d] px-4 py-3">
          <span className="text-gold text-[11px] font-medium tracking-[0.28em] uppercase">
            {values.bannerText || "PRIVATE DROP"}
          </span>
          <span className="text-muted-foreground text-[11px] tracking-[0.14em] uppercase">
            {values.bannerOfferText}
          </span>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save banner"}
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Announcement marquee ────────────────────────────────────────────────────

function AnnouncementForm({ content }: { content: HomepageContent }) {
  const router = useRouter();
  const initialMessages = useMemo(() => {
    const raw = content.announcement_messages;
    return Array.isArray(raw)
      ? raw.filter((item): item is string => typeof item === "string")
      : [];
  }, [content]);

  const initial = useMemo(
    () => ({
      announcementEnabled: content.announcement_enabled,
      announcementMessages: initialMessages,
      announcementSpeed: content.announcement_speed,
      announcementDirection: content.announcement_direction as "left" | "right",
    }),
    [content, initialMessages],
  );

  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [initial]);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  useUnsavedGuard(dirty);

  function setMessages(messages: string[]) {
    setValues((current) => ({ ...current, announcementMessages: messages }));
  }
  function updateMessage(index: number, text: string) {
    setMessages(
      values.announcementMessages.map((message, i) =>
        i === index ? text : message,
      ),
    );
  }
  function removeMessage(index: number) {
    setMessages(values.announcementMessages.filter((_, i) => i !== index));
  }
  function moveMessage(index: number, direction: -1 | 1) {
    const target = index + direction;
    const messages = [...values.announcementMessages];
    if (target < 0 || target >= messages.length) return;
    const current = messages[index];
    const swap = messages[target];
    if (current === undefined || swap === undefined) return;
    messages[index] = swap;
    messages[target] = current;
    setMessages(messages);
  }
  function addMessage() {
    if (values.announcementMessages.length >= 12) {
      toast.error("Up to 12 messages");
      return;
    }
    setMessages([...values.announcementMessages, ""]);
  }

  async function save() {
    const cleaned = values.announcementMessages
      .map((message) => message.trim())
      .filter(Boolean);
    setSaving(true);
    const result = await updateAnnouncementAction({
      ...values,
      announcementMessages: cleaned,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Announcement updated");
    router.refresh();
  }

  return (
    <SectionCard
      title="Announcement marquee"
      description="The scrolling ticker above the navigation."
      action={<DirtyBadge dirty={dirty} />}
    >
      <div className="space-y-4">
        <ToggleRow
          label="Show announcement bar"
          hint="Hide to remove the top ticker"
          checked={values.announcementEnabled}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              announcementEnabled: value,
            }))
          }
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Messages</p>
          {values.announcementMessages.length === 0 ? (
            <p className="text-muted-foreground text-xs">
              No messages yet — add one below.
            </p>
          ) : (
            <ul className="space-y-2">
              {values.announcementMessages.map((message, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Input
                    value={message}
                    maxLength={80}
                    onChange={(event) =>
                      updateMessage(index, event.target.value)
                    }
                    placeholder="Complimentary shipping over ₹2,000"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => moveMessage(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Move down"
                    disabled={index === values.announcementMessages.length - 1}
                    onClick={() => moveMessage(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove"
                    onClick={() => removeMessage(index)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMessage}
          >
            <Plus /> Add message
          </Button>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save announcement"}
        </Button>
      </div>
    </SectionCard>
  );
}

// ─── Testimonials shortcut ───────────────────────────────────────────────────

function TestimonialsCard({ pending }: { pending: number }) {
  return (
    <SectionCard
      title="Testimonials"
      description="Customer voices shown on the homepage."
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-muted flex size-10 items-center justify-center rounded-full">
            <MessageSquareQuote className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">
              {pending > 0
                ? `${pending} awaiting approval`
                : "No pending submissions"}
            </p>
            <p className="text-muted-foreground text-xs">
              Review, approve or reject customer testimonials.
            </p>
          </div>
        </div>
        <LinkButton variant="outline" href="/admin/testimonials">
          Manage testimonials <ExternalLink />
        </LinkButton>
      </div>
    </SectionCard>
  );
}

export function ContentManager({
  content,
  pendingTestimonials,
}: {
  content: HomepageContent;
  pendingTestimonials: number;
}) {
  return (
    <div className="space-y-6">
      <HeroForm content={content} />
      <BannerForm content={content} />
      <AnnouncementForm content={content} />
      <TestimonialsCard pending={pendingTestimonials} />
    </div>
  );
}
