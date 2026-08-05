"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * BorderGlow — a champagne light that rides the card's border toward the
 * cursor. A masked radial-gradient ring (only the 1px edge shows) reveals on
 * hover. Pointer position is written to CSS custom properties (no re-render).
 * Styling lives in globals.css under `.border-glow`.
 */
export function BorderGlow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn("border-glow", className)}
    >
      {children}
    </div>
  );
}
