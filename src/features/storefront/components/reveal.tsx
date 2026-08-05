"use client";

import {
  type HTMLMotionProps,
  type Variants,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { type ReactNode, useRef } from "react";

/**
 * Shared luxury motion language for the storefront.
 *
 * Reveals are a slow, soft opacity lift with a small upward translate on a
 * gentle ease-out curve — never a cheap snap-fade. Groups stagger their
 * children so a section assembles itself as it enters the viewport.
 *
 * Reveals are driven by `useInView` + `animate` rather than `whileInView`.
 * `whileInView` server-renders the *visible* target state (there is no viewport
 * on the server) while the client starts hidden — a hydration mismatch.
 * `useInView` is effect-based, so it is `false` during SSR and the first client
 * render alike: both render the hidden state, hydration matches, and the reveal
 * plays once the element scrolls into view on the client. Reduced motion
 * collapses the transition to an instant appearance.
 */

// The single easing curve used across the storefront (expo-style ease-out).
export const EASE_LUXE = [0.22, 1, 0.36, 1] as const;
export const REVEAL_DURATION = 0.85;
const VIEWPORT_MARGIN = "-80px";

/** Elegant single reveal — a soft fade with a subtle upward translate, once. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: REVEAL_DURATION, ease: EASE_LUXE, delay }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * A container that reveals its {@link RevealItem} children in a gentle stagger
 * as it scrolls into view. Compose them: `<Stagger><RevealItem/>…</Stagger>`.
 */
export function Stagger({
  children,
  className,
  gap = 0.09,
  delay = 0,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: VIEWPORT_MARGIN });
  const variants: Variants = {
    hidden: {},
    show: {
      transition: reduce
        ? { staggerChildren: 0 }
        : { staggerChildren: gap, delayChildren: delay },
    },
  };
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child — must be rendered inside a {@link Stagger}. */
export function RevealItem({
  children,
  className,
  y = 28,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  y?: number;
} & Omit<HTMLMotionProps<"div">, "children">) {
  const reduce = useReducedMotion();
  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: {
      opacity: 1,
      y: 0,
      transition: reduce
        ? { duration: 0 }
        : { duration: REVEAL_DURATION, ease: EASE_LUXE },
    },
  };
  return (
    <motion.div className={className} variants={variants} {...rest}>
      {children}
    </motion.div>
  );
}
