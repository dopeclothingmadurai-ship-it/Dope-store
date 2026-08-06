import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-5 text-center">
      <p className="font-display text-foreground/[0.08] text-[28vw] leading-none font-medium tracking-tight select-none sm:text-[12rem]">
        404
      </p>
      <p className="text-gold -mt-4 text-[11px] font-medium tracking-[0.3em] uppercase sm:-mt-8">
        Off the grid
      </p>
      <h1 className="font-display mt-4 text-3xl font-light tracking-tight sm:text-5xl">
        Looks like this drop never existed.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
        The page you&apos;re after has moved, sold out, or was never released.
      </p>
      <Link
        href="/shop"
        className="bg-foreground text-background mt-9 flex h-12 items-center justify-center px-9 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
