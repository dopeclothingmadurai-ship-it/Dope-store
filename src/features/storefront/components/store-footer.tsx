import Link from "next/link";

export function StoreFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border mt-24 border-t sm:mt-32">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="font-display text-5xl leading-none font-light tracking-[0.06em] sm:text-6xl">
              DOPE
            </p>
            <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
              Considered clothing for the confident. Designed in-house, made to
              last, worn on your terms.
            </p>
          </div>

          <nav className="flex gap-16">
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
                Shop
              </p>
              <Link
                href="/shop"
                className="text-foreground/80 hover:text-foreground text-sm transition-colors"
              >
                All products
              </Link>
              <Link
                href="/"
                className="text-foreground/80 hover:text-foreground text-sm transition-colors"
              >
                Home
              </Link>
            </div>
          </nav>
        </div>

        <div className="border-border mt-16 flex flex-col gap-3 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs tracking-wide">
            © {year} Dope Store. All rights reserved.
          </p>
          <p className="text-muted-foreground/70 text-xs tracking-[0.18em] uppercase">
            Made in India
          </p>
        </div>
      </div>
    </footer>
  );
}
