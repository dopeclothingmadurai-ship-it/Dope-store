import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-gold text-[11px] font-medium tracking-[0.3em] uppercase">
        404
      </p>
      <h1 className="font-display mt-4 text-3xl font-light tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed">
        The piece you&apos;re looking for may have moved or sold out.
      </p>
      <Link
        href="/shop"
        className="bg-foreground text-background mt-8 flex h-12 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90"
      >
        Back to shop
      </Link>
    </div>
  );
}
