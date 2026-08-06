import { Droplets, Sparkles, Sun, Wind } from "lucide-react";

import { MaskReveal, Reveal } from "./reveal";

// Generic, garment-safe care guidance — true brand-wide, never fabricated
// per-product specifications.
const CARE = [
  { icon: Droplets, label: "Machine wash cold" },
  { icon: Sparkles, label: "Do not bleach" },
  { icon: Sun, label: "Iron on low heat" },
  { icon: Wind, label: "Dry flat, in shade" },
];

/**
 * Editorial product story + care guide, shown below the buy panel. The story
 * uses the product's own description (falling back to a brand line); the care
 * column shows universal garment guidance — no invented material specs.
 */
export function ProductStory({
  description,
  brand,
}: {
  description: string | null;
  brand: string | null;
}) {
  const story =
    description?.trim() ||
    "Considered construction and premium fabrics, finished to be worn every day and to only get better with time.";

  return (
    <section className="border-border mt-24 border-t pt-16 sm:mt-32 sm:pt-24">
      <div className="grid gap-14 lg:grid-cols-2 lg:gap-24">
        <div className="max-w-lg">
          <Reveal>
            <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
              {brand ? brand : "The Making"}
            </p>
          </Reveal>
          <h2 className="font-display mt-4 text-3xl leading-tight font-light tracking-tight sm:text-4xl">
            <MaskReveal delay={0.05}>Considered in every stitch</MaskReveal>
          </h2>
          <Reveal delay={0.12}>
            <p className="text-muted-foreground mt-6 text-[15px] leading-relaxed whitespace-pre-line">
              {story}
            </p>
          </Reveal>
        </div>

        <div>
          <Reveal>
            <p className="text-foreground/80 text-[12px] font-medium tracking-[0.2em] uppercase">
              Care
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {CARE.map((item) => (
                <li key={item.label} className="flex items-center gap-3.5">
                  <span className="border-border text-gold flex size-10 shrink-0 items-center justify-center rounded-full border">
                    <item.icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <span className="text-foreground/85 text-sm">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground/70 mt-8 text-xs leading-relaxed">
              Wash inside out with like colours. Reshape while damp.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
