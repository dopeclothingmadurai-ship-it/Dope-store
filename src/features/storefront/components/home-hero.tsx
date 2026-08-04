"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

const MARQUEE = [
  "NEW SEASON",
  "AUTUMN — WINTER 26",
  "DEFINE YOUR SILHOUETTE",
  "MADE TO LAST",
];

export function HomeHero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Gentle parallax: the image drifts up and fades as the hero leaves.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 0.85]);

  return (
    <section
      ref={ref}
      className="relative h-[100svh] min-h-[620px] overflow-hidden"
    >
      {/* Editorial image */}
      <motion.div
        style={reduce ? undefined : { y: imageY }}
        className="absolute inset-0"
      >
        <Image
          src="/editorial/inside-1.jpg"
          alt="Dope Store — Autumn Winter editorial"
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover object-[70%_center] brightness-90 contrast-105 grayscale"
        />
      </motion.div>

      {/* Legibility wash */}
      <motion.div
        style={reduce ? { opacity: 0.62 } : { opacity: overlayOpacity }}
        className="from-background via-background/40 to-background/30 absolute inset-0 bg-gradient-to-r"
      />
      <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-24 sm:px-8 sm:pb-28 lg:pb-32">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-gold text-[11px] font-medium tracking-[0.36em] uppercase"
        >
          The Autumn Edit
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="font-display mt-4 max-w-4xl text-[16vw] leading-[0.86] font-light tracking-tight text-white sm:text-8xl lg:text-[8.5rem]"
        >
          Where you
          <br />
          evolve.
        </motion.h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center"
        >
          <Link
            href="/shop"
            className="bg-foreground text-background group inline-flex h-12 items-center justify-center gap-2 px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
          >
            Shop Now
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/shop"
            className="text-foreground/90 hover:text-foreground border-foreground/40 hover:border-foreground inline-flex h-12 items-center justify-center border-b px-2 text-[12px] font-medium tracking-[0.2em] uppercase transition-colors"
          >
            Explore Collection
          </Link>
        </motion.div>
      </div>

      {/* Gold marquee */}
      <div className="border-border/60 bg-background/40 absolute inset-x-0 bottom-0 border-t backdrop-blur-sm">
        <div className="flex overflow-hidden py-3">
          <div className="dope-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((word, index) => (
              <span
                key={index}
                className="text-gold/80 flex items-center gap-10 text-[11px] font-medium tracking-[0.28em] whitespace-nowrap uppercase"
              >
                {word}
                <span className="bg-gold/50 size-1 rounded-full" />
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="dope-marquee flex shrink-0 items-center gap-10 pr-10"
          >
            {[...MARQUEE, ...MARQUEE].map((word, index) => (
              <span
                key={index}
                className="text-gold/80 flex items-center gap-10 text-[11px] font-medium tracking-[0.28em] whitespace-nowrap uppercase"
              >
                {word}
                <span className="bg-gold/50 size-1 rounded-full" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
