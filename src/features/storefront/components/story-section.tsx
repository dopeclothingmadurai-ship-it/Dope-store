import { MaskReveal, Reveal } from "./reveal";

/**
 * Luxury Story — a type-forward manifesto. Each line masks up in sequence over
 * generous whitespace; no imagery, letting the words carry the section.
 */
export function StorySection() {
  const lines = [
    { text: "Designed for", muted: false },
    { text: "those who don’t", muted: false },
    { text: "chase fashion.", muted: true },
    { text: "They define it.", muted: false },
  ];

  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-[1400px] px-5 py-28 sm:px-8 sm:py-40">
        <Reveal>
          <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
            The Dope Ethos
          </p>
        </Reveal>
        <h2 className="font-display mt-8 max-w-5xl text-[10.5vw] leading-[1.02] font-light tracking-tight sm:mt-10 sm:text-6xl lg:text-[5.5rem] lg:leading-[1.04]">
          {lines.map((line, index) => (
            <span key={line.text} className="block overflow-hidden">
              <MaskReveal
                delay={index * 0.09}
                className={line.muted ? "text-muted-foreground" : undefined}
              >
                {line.text}
              </MaskReveal>
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
