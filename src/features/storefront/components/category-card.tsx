"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { type PointerEvent } from "react";
import { ArrowUpRight } from "lucide-react";

import { type StoreCategory } from "../types";

/**
 * A luxury category tile with a magnetic pull toward the cursor, a counter-
 * parallax image drift for depth, and a slow image scale on hover. Falls back
 * to an elegant typographic treatment when a category has no imagery yet.
 * Motion values are spring-smoothed and never trigger React re-renders.
 */
export function CategoryCard({ category }: { category: StoreCategory }) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const cardX = useSpring(px, { stiffness: 150, damping: 16, mass: 0.4 });
  const cardY = useSpring(py, { stiffness: 150, damping: 16, mass: 0.4 });
  // The image drifts opposite the card for a subtle parallax depth cue.
  const imageX = useTransform(cardX, (value) => value * -1.6);
  const imageY = useTransform(cardY, (value) => value * -1.6);

  function onMove(event: PointerEvent<HTMLElement>) {
    // Only track fine pointers — touch scrolling shouldn't jitter the tile.
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
    py.set(((event.clientY - rect.top) / rect.height - 0.5) * 18);
  }
  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <Link href={`/shop?category=${category.slug}`} className="block">
      <motion.article
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ x: cardX, y: cardY }}
        className="group bg-secondary relative aspect-[4/5] overflow-hidden"
      >
        {category.imageUrl ? (
          <motion.div
            style={{ x: imageX, y: imageY }}
            className="absolute inset-0"
          >
            <Image
              src={category.imageUrl}
              alt={category.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
              className="scale-[1.08] object-cover grayscale transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.14] group-hover:grayscale-0"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#1a1a1d_0%,#0c0c0d_70%)]" />
        )}

        {/* Depth wash */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/80" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl leading-tight font-medium tracking-tight text-white sm:text-[1.7rem]">
                {category.name}
              </h3>
              <p className="text-gold/80 mt-1.5 text-[10px] font-medium tracking-[0.22em] uppercase">
                {category.productCount > 0
                  ? `${category.productCount} ${category.productCount === 1 ? "piece" : "pieces"}`
                  : "Coming soon"}
              </p>
            </div>
            <span className="border-foreground/25 group-hover:border-gold group-hover:bg-gold/10 flex size-9 shrink-0 items-center justify-center rounded-full border transition-all duration-500">
              <ArrowUpRight
                className="text-foreground/80 group-hover:text-gold size-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
