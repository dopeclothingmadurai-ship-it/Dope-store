import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Parallax } from "./parallax";
import { MaskReveal, Reveal } from "./reveal";

export type SplitRow = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

/**
 * Editorial split layout — full-height image beside editorial copy, alternating
 * sides row to row like a campaign spread. Images drift on a slow parallax
 * inside an over-scaled frame; titles mask up on scroll.
 */
export function EditorialSplit({ rows }: { rows: SplitRow[] }) {
  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-[1400px] space-y-24 px-5 py-24 sm:space-y-36 sm:px-8 sm:py-32">
        {rows.map((row, index) => {
          const imageLeft = index % 2 === 0;
          return (
            <div
              key={row.title}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
            >
              <div
                className={cn(
                  "bg-secondary relative aspect-[4/5] overflow-hidden sm:aspect-[5/6]",
                  imageLeft ? "lg:order-1" : "lg:order-2",
                )}
              >
                <Parallax distance={44} className="absolute inset-0">
                  <Image
                    src={row.image}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="scale-[1.16] object-cover brightness-90 grayscale"
                  />
                </Parallax>
              </div>

              <div
                className={cn(
                  "max-w-md",
                  imageLeft ? "lg:order-2" : "lg:order-1 lg:ml-auto",
                )}
              >
                <Reveal>
                  <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
                    {row.eyebrow}
                  </p>
                </Reveal>
                <h3 className="font-display mt-5 text-4xl leading-[1.05] font-light tracking-tight sm:text-5xl">
                  <MaskReveal delay={0.05}>{row.title}</MaskReveal>
                </h3>
                <Reveal delay={0.12}>
                  <p className="text-muted-foreground mt-6 text-[15px] leading-relaxed">
                    {row.body}
                  </p>
                </Reveal>
                <Reveal delay={0.2}>
                  <Link
                    href={row.href}
                    className="text-foreground group mt-8 inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.18em] uppercase"
                  >
                    <span className="border-foreground/30 group-hover:border-foreground border-b pb-1 transition-colors">
                      {row.cta}
                    </span>
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Reveal>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
