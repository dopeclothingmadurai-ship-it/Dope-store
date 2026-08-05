"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { type PointerEvent, type ReactNode, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * SpecularButton — an Apple-grade CTA. The whole control is magnetically drawn
 * toward the cursor (spring-smoothed), a specular highlight tracks the pointer,
 * a warm-gold glass sheen sweeps across on hover, and the surface lifts with a
 * layered shadow + soft glow. Two finishes: `light` (ivory → warm gold reveal)
 * and `gold` (reflective outline). Pointer tracking writes CSS custom
 * properties directly and drives motion values — no React state per move.
 *
 * Styling lives in globals.css under `.specular-btn`.
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
  const innerRef = useRef<HTMLElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18, mass: 0.5 });
  const y = useSpring(my, { stiffness: 220, damping: 18, mass: 0.5 });

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    // Specular highlight position for the inner surface.
    innerRef.current?.style.setProperty(
      "--mx",
      `${(relX / rect.width) * 100}%`,
    );
    innerRef.current?.style.setProperty(
      "--my",
      `${(relY / rect.height) * 100}%`,
    );
    // Magnetic pull toward the cursor (subtle, capped by the multipliers).
    mx.set((relX - rect.width / 2) * 0.18);
    my.set((relY - rect.height / 2) * 0.3);
  }
  function reset() {
    mx.set(0);
    my.set(0);
  }

  const classes = cn(
    "specular-btn",
    variant === "gold" ? "specular-btn--gold" : "specular-btn--light",
    className,
  );

  const inner = (
    <>
      <span className="specular-btn__glow" aria-hidden />
      <span className="specular-btn__reveal" aria-hidden />
      <span className="specular-btn__sweep" aria-hidden />
      <span className="specular-btn__label">{children}</span>
    </>
  );

  return (
    <motion.div
      className="inline-flex"
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
    >
      {href ? (
        <Link
          ref={(node) => {
            innerRef.current = node;
          }}
          href={href}
          className={classes}
          aria-label={ariaLabel}
        >
          {inner}
        </Link>
      ) : (
        <button
          ref={(node) => {
            innerRef.current = node;
          }}
          type="button"
          className={classes}
          onClick={onClick}
          aria-label={ariaLabel}
        >
          {inner}
        </button>
      )}
    </motion.div>
  );
}
