import { type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Seamless, infinitely-looping marquee — measurement-free and gap-proof at any
 * width, with any amount of content.
 *
 * Architecture (see `.dope-marquee-group` in globals.css):
 *
 *   VIEWPORT (overflow-hidden, flex)
 *   ├── GROUP A  (min-width:100%, animates translateX 0 → -100%)
 *   └── GROUP B  (identical to A, same animation)
 *
 * `min-width:100%` guarantees each group is at least as wide as the viewport,
 * so a group can never leave an empty strip. `justify-around` fans the items
 * out to fill when the content is shorter than the viewport, and collapses to
 * natural spacing when it is longer — the seam between the two groups stays
 * consistent because both groups are identical. Each group translates by
 * exactly one group-width, so when group A has fully exited, the identical
 * group B occupies the same pixels: no jump, flash, reset, or blank frame.
 *
 * There is intentionally NO JavaScript measurement or interval here, so a
 * parent re-render (e.g. a ticking countdown elsewhere) can never restart or
 * perturb the animation.
 */
export function Marquee({
  items,
  durationSeconds = 24,
  direction = "left",
  pauseOnHover = false,
  className,
  itemClassName,
}: {
  items: ReactNode[];
  durationSeconds?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
  itemClassName?: string;
}) {
  if (items.length === 0) return null;

  const groupClass = cn(
    "dope-marquee-group flex min-w-full shrink-0 items-center justify-around",
    direction === "right" && "dope-marquee-group--reverse",
    pauseOnHover && "dope-marquee-group--pausable",
  );
  const groupStyle = {
    "--marquee-duration": `${durationSeconds}s`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "dope-marquee-viewport flex w-full overflow-hidden select-none",
        className,
      )}
    >
      {[0, 1].map((group) => (
        <div
          key={group}
          aria-hidden={group === 1}
          className={groupClass}
          style={groupStyle}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className={cn("flex shrink-0 items-center", itemClassName)}
            >
              {item}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
