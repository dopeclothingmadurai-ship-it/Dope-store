import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The official Dope Store brand mark. Renders the real logo asset
 * (`public/dope-logo.png`) as a premium rounded tile — used in the admin
 * sidebar and on the login page. Never a text or generated substitute.
 */
export function DopeLogo({
  size = 36,
  className,
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl shadow-lg ring-1 shadow-black/40 ring-white/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/dope-logo.png"
        alt="Dope Store"
        width={size}
        height={size}
        priority={priority}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
