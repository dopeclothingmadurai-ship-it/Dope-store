"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

import { type StoreHero } from "@/features/homepage/types";

import { EASE_LUXE } from "./reveal";
import { BlurText } from "./blur-text";
import { SpecularButton } from "./specular-button";

const FALLBACK_IMAGE = "/editorial/inside-1.jpg";
const SLIDE_MS = 6500; // dwell per image
const FADE_S = 1.5; // crossfade seconds

const IMAGE_CLASS =
  "object-cover object-[70%_center] brightness-90 contrast-105 grayscale";

export function HomeHero({ hero }: { hero: StoreHero }) {
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

  const images = hero.images.length > 0 ? hero.images : [FALLBACK_IMAGE];
  const multi = images.length > 1 && !reduce;

  // Auto-advance through the campaign images.
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!multi) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [multi, images.length]);

  const current = images[active] ?? images[0]!;
  const nextIndex = images.length > 1 ? (active + 1) % images.length : 0;
  const nextSrc = images[nextIndex];

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-black"
    >
      {/* Editorial image — scroll drift + mouse depth, wrapping the slides */}
      <motion.div
        style={reduce ? undefined : { y: imageY }}
        className="absolute inset-0"
      >
        <motion.div
          style={reduce ? undefined : { x: imgX, y: imgY }}
          className="absolute inset-0 scale-[1.08]"
        >
          {reduce ? (
            // Reduced motion: a single still frame, no cycling or zoom.
            <div className="absolute inset-0">
              <Image
                src={current}
                alt="Dope Store — editorial"
                fill
                priority
                quality={90}
                sizes="100vw"
                className={IMAGE_CLASS}
              />
            </div>
          ) : (
            <AnimatePresence>
              {/* Active slide: cinematic crossfade + slow Ken Burns scale. */}
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_S, ease: EASE_LUXE }}
                className="absolute inset-0"
              >
                <motion.div
                  initial={{ scale: 1.06 }}
                  animate={{ scale: 1.14 }}
                  transition={{
                    duration: SLIDE_MS / 1000 + FADE_S + 1,
                    ease: "linear",
                  }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current}
                    alt="Dope Store — editorial"
                    fill
                    priority={active === 0}
                    quality={90}
                    sizes="100vw"
                    className={IMAGE_CLASS}
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Warm the next image so the crossfade never pops. Kept out of the
              a11y tree and off-screen; only ONE image ahead is prefetched. */}
          {multi && nextSrc && nextSrc !== current ? (
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
              <Image
                src={nextSrc}
                alt=""
                fill
                quality={90}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : null}
        </motion.div>
      </motion.div>

      {/* Legibility washes */}
      <motion.div
        style={reduce ? { opacity: 0.62 } : { opacity: overlayOpacity }}
        className="from-background via-background/40 to-background/30 absolute inset-0 bg-gradient-to-r"
      />
      <div className="from-background absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

      {/* Slide indicators */}
      {multi ? (
        <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 sm:bottom-10">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show hero image ${index + 1}`}
              aria-current={index === active}
              className="group p-1.5"
            >
              <span
                className={
                  index === active
                    ? "bg-gold block h-px w-8 transition-all duration-500"
                    : "bg-foreground/30 group-hover:bg-foreground/60 block h-px w-4 transition-all duration-500"
                }
              />
            </button>
          ))}
        </div>
      ) : null}

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
          animate={reduce ? undefined : { y: [0, -5, 0] }}
          transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        >
          {/* Fixed editorial hero typography — refined, luxury, not aggressive.
              The admin edits only the words; the font/scale stay premium. */}
          <h1 className="font-editorial max-w-3xl text-[8vw] leading-[1.05] font-normal tracking-[-0.005em] text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.04]">
            <BlurText text={hero.tagline} delay={0.25} stagger={0.11} />
          </h1>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_LUXE, delay: 1.05 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5"
        >
          <SpecularButton href={hero.ctaHref} variant="light">
            {hero.ctaLabel}
            <ArrowRight className="size-4" />
          </SpecularButton>
          <SpecularButton href="/categories" variant="gold">
            Explore Collection
          </SpecularButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
