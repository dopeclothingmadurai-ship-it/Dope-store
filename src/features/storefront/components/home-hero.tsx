"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { type MouseEvent, useRef } from "react";
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
  // Scroll parallax: the image drifts up and the wash deepens as the hero exits.
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 1], [0.5, 0.85]);

  // Mouse depth: the image leans toward the cursor, the copy drifts against it.
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const imgX = useSpring(mvX, { stiffness: 70, damping: 20, mass: 0.6 });
  const imgY = useSpring(mvY, { stiffness: 70, damping: 20, mass: 0.6 });
  const textX = useTransform(imgX, (value) => value * -0.45);
  const textY = useTransform(imgY, (value) => value * -0.45);

  function onMouseMove(event: MouseEvent<HTMLElement>) {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mvX.set(((event.clientX - rect.left) / rect.width - 0.5) * 26);
    mvY.set(((event.clientY - rect.top) / rect.height - 0.5) * 26);
  }
  function onMouseLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative h-[100svh] min-h-[640px] overflow-hidden"
    >
      {/* Editorial image — scroll drift + mouse depth + slow entrance zoom */}
      <motion.div
        style={reduce ? undefined : { y: imageY }}
        className="absolute inset-0"
      >
        <motion.div
          style={reduce ? undefined : { x: imgX, y: imgY }}
          className="absolute inset-0 scale-[1.08]"
        >
          <motion.div
            initial={reduce ? false : { scale: 1.16 }}
            animate={{ scale: 1.03 }}
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
      </motion.div>

      {/* Legibility washes */}
      <motion.div
        style={reduce ? { opacity: 0.62 } : { opacity: overlayOpacity }}
        className="from-background via-background/40 to-background/30 absolute inset-0 bg-gradient-to-r"
      />
      <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        style={reduce ? undefined : { x: textX, y: textY }}
        className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-24 sm:px-8 sm:pb-28 lg:pb-32"
      >
        <motion.div
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, ease: EASE_LUXE, delay: 0.15 }}
          className="via-gold/70 mb-7 h-px w-24 origin-left bg-gradient-to-r from-transparent to-transparent"
        />

        <motion.div
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
        >
          <h1 className="font-editorial max-w-5xl text-[13.5vw] leading-[0.94] font-semibold tracking-[-0.01em] text-white sm:text-7xl lg:text-[6.75rem] lg:leading-[0.92]">
            <BlurText
              text="It's all about fashion broh"
              delay={0.25}
              stagger={0.13}
            />
          </h1>
        </motion.div>

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
      </motion.div>
    </section>
  );
}
