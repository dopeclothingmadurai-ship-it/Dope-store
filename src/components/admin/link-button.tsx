import { type VariantProps } from "class-variance-authority";
import Link from "next/link";
import { type ComponentProps } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A Next.js `Link` styled as a button. Use this for navigation instead of
 * `<Button render={<Link/>}>` — it renders a real anchor, so it keeps correct
 * link semantics without Base UI's native-button warning.
 */
export function LinkButton({
  className,
  variant,
  size,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
