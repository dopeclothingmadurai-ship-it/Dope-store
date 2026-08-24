"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { BorderGlow } from "./border-glow";
import { type StoreCategory } from "../types";

/**
 * A "Shop by Category" tile with a black-and-white → colour reveal.
 *
 * Desktop (fine pointer): the reveal + border glow follow hover, as before.
 * Touch (coarse pointer, no hover): an IntersectionObserver reveals the tile in
 * colour — and shows a gentle static edge glow — while it sits in the centre of
 * the viewport, so the premium interaction survives on phones/tablets. A single
 * tap still navigates (the reveal never blocks the link). Reduced-motion users
 * get the end state without the transition (handled globally).
 */
export function CategoryRevealTile({ category }: { category: StoreCategory }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Only scroll-reveal where there is no hover; desktop keeps hover behaviour.
    if (!window.matchMedia("(hover: none)").matches) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setRevealed(entry?.isIntersecting ?? false),
      { rootMargin: "-30% 0px -30% 0px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <BorderGlow className={cn("rounded-2xl", revealed && "is-revealed")}>
      <Link
        ref={ref}
        href={`/shop?category=${category.slug}`}
        className="group bg-secondary relative block aspect-[4/5] overflow-hidden rounded-2xl"
      >
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 30vw"
            className={cn(
              "object-cover transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.12] group-hover:grayscale-0",
              revealed ? "scale-[1.12] grayscale-0" : "scale-[1.05] grayscale",
            )}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#1a1a1d_0%,#0c0c0d_70%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/80" />

        <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl leading-tight font-medium tracking-tight text-white sm:text-[1.6rem]">
                {category.name}
              </h3>
              <span
                className={cn(
                  "bg-gold mt-2 block h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-10",
                  revealed ? "w-10" : "w-0",
                )}
              />
              <p className="text-gold/80 mt-2 text-[10px] font-medium tracking-[0.22em] uppercase">
                {category.productCount > 0
                  ? `${category.productCount} ${category.productCount === 1 ? "piece" : "pieces"}`
                  : "Coming soon"}
              </p>
            </div>
            <ArrowUpRight
              className="text-foreground/70 group-hover:text-gold size-5 shrink-0 transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </Link>
    </BorderGlow>
  );
}
