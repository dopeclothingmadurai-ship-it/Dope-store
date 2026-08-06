import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Parallax } from "./parallax";
import { MaskReveal, Reveal } from "./reveal";

/**
 * Full-bleed campaign banner — a dark, minimal season statement over cinematic
 * photography with a slow parallax and a mask-revealed headline.
 */
export function CampaignBanner() {
  return (
    <section className="relative h-[82vh] min-h-[520px] overflow-hidden">
      <Parallax distance={70} className="absolute inset-0">
        <Image
          src="/editorial/editorial-store.jpg"
          alt="Dope Store — Autumn 2026 campaign"
          fill
          unoptimized
          sizes="100vw"
          className="scale-[1.18] object-cover brightness-75 grayscale"
        />
      </Parallax>
      <div className="from-background/80 via-background/40 to-background/70 absolute inset-0 bg-gradient-to-b" />

      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 sm:px-8">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.36em] uppercase">
            Autumn 2026
          </p>
        </Reveal>
        <h2 className="font-editorial mt-5 max-w-3xl text-5xl leading-[0.98] font-semibold tracking-tight text-white sm:text-7xl lg:text-8xl">
          <span className="block">
            <MaskReveal>The New</MaskReveal>
          </span>
          <span className="block">
            <MaskReveal delay={0.09}>Collection</MaskReveal>
          </span>
        </h2>
        <Reveal delay={0.2}>
          <Link
            href="/shop"
            className="group mt-9 inline-flex items-center gap-2.5 text-[12px] font-medium tracking-[0.2em] text-white uppercase"
          >
            <span className="border-b border-white/40 pb-1 transition-colors group-hover:border-white">
              Explore
            </span>
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
