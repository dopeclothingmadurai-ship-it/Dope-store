import Link from "next/link";

import { NewsletterForm } from "@/features/newsletter/components/newsletter-form";
import { listCategoryLinks } from "@/features/storefront/queries";

/** Inline Instagram glyph (kept local — not in this lucide-react build). */
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SHOP_LINKS = [
  { label: "All products", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Dope Archive", href: "/archive" },
  { label: "Testimonials", href: "/testimonials" },
];

const SUPPORT_LINKS = [
  { label: "Your account", href: "/account" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

export async function StoreFooter() {
  const year = new Date().getFullYear();
  const categories = await listCategoryLinks(6);

  return (
    <footer className="border-border mt-24 border-t sm:mt-32">
      {/* Brand statement */}
      <div className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-8 sm:pt-28">
        <p className="font-display text-muted-foreground max-w-4xl text-3xl leading-[1.15] font-light tracking-tight sm:text-5xl lg:text-6xl">
          Considered clothing for those who{" "}
          <span className="text-foreground">define their own</span> style.
        </p>
      </div>

      {/* Columns */}
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <FooterColumn title="Shop" links={SHOP_LINKS} />

          <FooterColumn
            title="Categories"
            links={
              categories.length > 0
                ? categories.map((category) => ({
                    label: category.name,
                    href: `/shop?category=${category.slug}`,
                  }))
                : [{ label: "Browse all", href: "/categories" }]
            }
          />

          <FooterColumn title="Support" links={SUPPORT_LINKS} />

          {/* Contact + pickup */}
          <div className="flex flex-col gap-3.5">
            <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
              Contact
            </p>
            <a
              href="mailto:hello@dopestore.in"
              className="text-foreground/80 hover:text-foreground w-fit text-sm transition-colors"
            >
              hello@dopestore.in
            </a>
            <a
              href="tel:+919000000000"
              className="text-foreground/80 hover:text-foreground w-fit text-sm transition-colors"
            >
              +91 90000 00000
            </a>
            <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
              Store pickup available at the nearest Dope Store — show your order
              number at collection.
            </p>
          </div>

          {/* Newsletter + social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
              The Dope List
            </p>
            <p className="text-foreground/85 mt-4 text-sm leading-relaxed">
              Early access to drops and private previews. No noise.
            </p>
            <div className="mt-5">
              <NewsletterForm />
            </div>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground group mt-8 inline-flex items-center gap-2.5 text-[12px] font-medium tracking-[0.16em] uppercase transition-colors"
            >
              <InstagramIcon className="size-4 transition-transform duration-300 group-hover:scale-110" />
              Follow @dope
            </a>
          </div>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="mx-auto max-w-[1400px] overflow-hidden px-5 sm:px-8">
        <p
          aria-hidden
          className="font-display text-foreground/[0.06] text-[24vw] leading-[0.8] font-medium tracking-tight select-none"
        >
          DOPE
        </p>
      </div>

      {/* Bottom bar */}
      <div className="border-border border-t">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-muted-foreground text-xs tracking-wide">
            © {year} Dope Store. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Privacy
            </Link>
            <p className="text-muted-foreground/70 text-xs tracking-[0.18em] uppercase">
              Made in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-muted-foreground/70 text-[11px] font-medium tracking-[0.2em] uppercase">
        {title}
      </p>
      {links.map((link) => (
        <Link
          key={`${title}-${link.href}-${link.label}`}
          href={link.href}
          className="text-foreground/80 hover:text-foreground w-fit text-sm transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
