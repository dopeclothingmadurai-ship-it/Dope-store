"use client";

import Link from "next/link";
import { type PointerEvent, type ReactNode, useCallback } from "react";

import { cn } from "@/lib/utils";

/**
 * SpecularButton — an Apple-grade CTA. A soft specular highlight tracks the
 * cursor, a glass sheen sweeps across on hover, and the surface lifts with a
 * layered shadow. Two finishes: `light` (ivory glass) and `gold` (reflective
 * outline). Cursor tracking writes CSS custom properties directly — no React
 * state per move, so there is zero re-render cost.
 *
 * Styling lives in globals.css under `.specular-btn` so the effect is shared
 * and tunable in one place.
 */
type SpecularButtonProps = {
  children: ReactNode;
  variant?: "light" | "gold";
  href?: string;
  onClick?: () => void;
  className?: string;
  "aria-label"?: string;
};

export function SpecularButton({
  children,
  variant = "light",
  href,
  onClick,
  className,
  "aria-label": ariaLabel,
}: SpecularButtonProps) {
  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty(
      "--mx",
      `${((event.clientX - rect.left) / rect.width) * 100}%`,
    );
    el.style.setProperty(
      "--my",
      `${((event.clientY - rect.top) / rect.height) * 100}%`,
    );
  }, []);

  const classes = cn(
    "specular-btn",
    variant === "gold" ? "specular-btn--gold" : "specular-btn--light",
    className,
  );

  const inner = (
    <>
      <span className="specular-btn__glow" aria-hidden />
      <span className="specular-btn__sweep" aria-hidden />
      <span className="specular-btn__label">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        onPointerMove={onPointerMove}
        aria-label={ariaLabel}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onPointerMove={onPointerMove}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}
