"use client";

import { type Variants, motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";

import { EASE_LUXE } from "./reveal";

/**
 * BlurText — a luxury fashion-ad word reveal. Each word rises from a soft blur
 * into focus with a staggered cadence, like type resolving on a campaign film.
 * Not the generic demo: longer easing, real blur travel, per-word stagger, and
 * a reduced-motion path that simply fades. Runs on mount (hero entrance), so it
 * is hydration-safe — server and client both render the hidden state.
 */
export function BlurText({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.14,
  duration = 1.05,
  blur = 14,
  y = 30,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  blur?: number;
  y?: number;
}) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduce ? 0 : stagger,
        delayChildren: delay,
      },
    },
  };

  const word: Variants = {
    hidden: reduce
      ? { opacity: 0 }
      : { opacity: 0, y, filter: `blur(${blur}px)` },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: reduce ? 0.4 : duration, ease: EASE_LUXE },
    },
  };

  return (
    <motion.span
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
      style={{ display: "inline-block" }}
      aria-label={text}
    >
      {words.map((token, index) => (
        <Fragment key={`${token}-${index}`}>
          <motion.span
            variants={word}
            aria-hidden
            className={wordClassName}
            style={{
              display: "inline-block",
              willChange: "transform, filter, opacity",
            }}
          >
            {token}
          </motion.span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}
