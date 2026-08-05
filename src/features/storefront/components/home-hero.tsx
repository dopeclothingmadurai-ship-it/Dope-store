"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

import { EASE_LUXE } from "./reveal";
import { BlurText } from "./blur-text";
import { SpecularButton } from "./specular-button";

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
      className="relative h-[100svh] min-h-[640px] overflow-hidden"
    >
      {/* Editorial image — parallax drift + a slow cinematic zoom on entrance */}
      <motion.div
        style={reduce ? undefined : { y: imageY }}
        className="absolute inset-0"
      >
        <motion.div
          initial={reduce ? false : { scale: 1.18 }}
          animate={{ scale: 1.04 }}
          transition={{ duration: 1.9, ease: EASE_LUXE }}
          className="absolute inset-0"
        >
          <Image
            src="/editorial/inside-1.jpg"
            alt="Dope Store — editorial"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] brightness-90 contrast-105 grayscale"
          />
        </motion.div>
      </motion.div>

      {/* Legibility washes */}
      <motion.div
        style={reduce ? { opacity: 0.62 } : { opacity: overlayOpacity }}
        className="from-background via-background/40 to-background/30 absolute inset-0 bg-gradient-to-r"
      />
      <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

      {/* Content */}
      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-24 sm:px-8 sm:pb-28 lg:pb-32">
        {/* Thin gold rule that draws in for hierarchy */}
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: EASE_LUXE, delay: 0.15 }}
          className="via-gold/70 mb-7 h-px w-24 origin-left bg-gradient-to-r from-transparent to-transparent"
        />

        <h1 className="font-display max-w-5xl text-[13vw] leading-[0.92] font-semibold tracking-tight text-white sm:text-7xl lg:text-[6.75rem] lg:leading-[0.9]">
          <BlurText
            text="It's all about fashion broh"
            delay={0.25}
            stagger={0.13}
          />
        </h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXE, delay: 1.05 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
        >
          <SpecularButton href="/shop" variant="light">
            Shop Now
            <ArrowRight className="size-4" />
          </SpecularButton>
          <SpecularButton href="/shop" variant="gold">
            Explore Collection
          </SpecularButton>
        </motion.div>
      </div>
    </section>
  );
}
