"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * SpotlightCard — a champagne spotlight tracks the cursor across the surface,
 * the card lifts, and a glass sheen catches the light. Pointer position is
 * written to CSS custom properties (no re-render). Styling lives in globals.css
 * under `.spotlight-card`.
 */
export function SpotlightCard({
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
    el.style.setProperty("--sx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      className={cn("spotlight-card", className)}
    >
      {children}
    </div>
  );
}
