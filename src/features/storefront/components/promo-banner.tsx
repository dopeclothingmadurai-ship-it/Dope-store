"use client";

import { useEffect, useState } from "react";

import { type StorePromoBanner } from "@/features/homepage/types";

import { Marquee } from "./marquee";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Fixed-width D·H·M·S string (always "00D 00H 00M 00S"). Constant character
 * count + tabular-nums means the countdown NEVER changes width as it ticks, so
 * the marquee seam can never shift.
 */
function formatFixed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${pad(days)}D ${pad(hours)}H ${pad(minutes)}M ${pad(seconds)}S`;
}

/**
 * Self-contained live countdown. It owns its own interval/state, so it ticks in
 * isolation — the parent banner and the marquee track never re-render on its
 * account, and the animation is never restarted. Renders a constant-width
 * placeholder on the server / first paint (no hydration mismatch), then goes
 * live after mount.
 */
function LiveCountdown({ target }: { target: number }) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return (
    <span
      suppressHydrationWarning
      className="border-gold/30 text-foreground rounded-full border px-3 py-1 text-[11px] font-medium tracking-[0.18em] tabular-nums sm:text-xs"
    >
      {formatFixed(ms ?? Math.max(0, target - Date.now()))}
    </span>
  );
}

/**
 * The promotional banner beside the hero — a cinematic, full-bleed editorial
 * band that loops infinitely (seamless marquee). The offer/text and optional
 * live countdown ride inside the moving line. The marquee items are built once
 * and stay stable; only the isolated countdown ticks.
 */
export function PromoBanner({ banner }: { banner: StorePromoBanner }) {
  if (!banner.enabled || !banner.text.trim()) return null;

  const endsAt = banner.countdownEndsAt
    ? new Date(banner.countdownEndsAt).getTime()
    : null;
  const showCountdown =
    banner.countdownEnabled && endsAt !== null && !Number.isNaN(endsAt);

  // One editorial "unit". Each unit carries its own trailing space (`pr-*`) so
  // spacing — including across the loop seam — stays perfectly uniform.
  const unit = (
    <span className="flex items-center gap-6 pr-6 whitespace-nowrap sm:gap-9 sm:pr-9">
      <span className="text-gold text-[11px] font-medium tracking-[0.32em] uppercase sm:text-xs">
        {banner.text}
      </span>
      {banner.offerText.trim() ? (
        <span className="text-foreground/70 text-[11px] tracking-[0.14em] uppercase sm:text-xs">
          {banner.offerText}
        </span>
      ) : null}
      {showCountdown && endsAt !== null ? (
        <LiveCountdown target={endsAt} />
      ) : null}
      <span
        aria-hidden
        className="text-gold/50 rotate-45 text-[8px] sm:text-[9px]"
      >
        ◆
      </span>
    </span>
  );

  // Enough units to read as a continuous ticker (and exceed any viewport, which
  // also keeps the scroll speed constant across breakpoints). `min-w-full` in
  // the marquee still guarantees no gap even with fewer/shorter items.
  const items = Array.from({ length: 8 }, (_, index) => (
    <span key={index} className="flex items-center">
      {unit}
    </span>
  ));

  return (
    <section
      aria-label="Promotion"
      className="border-gold/15 relative border-y bg-[#0c0c0d] py-3.5 sm:py-4"
    >
      {/* Edge fades so the loop dissolves into the band rather than cutting off. */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r to-transparent sm:w-28" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l to-transparent sm:w-28" />
      <Marquee
        items={items}
        durationSeconds={banner.speed}
        direction={banner.direction}
      />
    </section>
  );
}
