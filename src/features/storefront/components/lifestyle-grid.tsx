import Image from "next/image";

import { MaskReveal, Reveal, RevealItem, Stagger } from "./reveal";

type Tile = {
  image: string;
  caption: string;
  className: string;
  aspect: string;
};

const TILES: Tile[] = [
  {
    image: "/editorial/editorial-pose.jpg",
    caption: "On the street",
    className: "sm:col-span-7 sm:row-span-2",
    aspect: "aspect-[4/5] sm:h-full sm:aspect-auto",
  },
  {
    image: "/editorial/editorial-rack.jpg",
    caption: "In the studio",
    className: "sm:col-span-5",
    aspect: "aspect-[16/10]",
  },
  {
    image: "/editorial/editorial-street.jpg",
    caption: "Off duty",
    className: "sm:col-span-5",
    aspect: "aspect-[16/10]",
  },
];

/**
 * Lifestyle campaign — an asymmetric editorial photo grid (no product cards),
 * minimal captions, slow hover zoom, staggered reveal.
 */
export function LifestyleGrid() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mb-12 max-w-xl">
          <Reveal>
            <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
              The Lifestyle
            </p>
          </Reveal>
          <h2 className="font-display mt-3 text-3xl font-light tracking-tight sm:text-5xl">
            <MaskReveal delay={0.05}>Lived in, not styled</MaskReveal>
          </h2>
        </div>

        <Stagger
          gap={0.08}
          className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:gap-4"
        >
          {TILES.map((tile) => (
            <RevealItem key={tile.image} className={tile.className}>
              <figure
                className={`group bg-secondary relative w-full overflow-hidden ${tile.aspect}`}
              >
                <Image
                  src={tile.image}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover brightness-90 grayscale transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
                <figcaption className="absolute bottom-5 left-5 text-[11px] font-medium tracking-[0.24em] text-white/90 uppercase">
                  {tile.caption}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
