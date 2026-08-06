"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";

import { useWishlist, wishlistCount } from "@/features/wishlist/use-wishlist";
import { cn } from "@/lib/utils";

import { CartDrawer } from "./cart-drawer";
import { cartCount, useCart } from "./use-cart";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Testimonials", href: "/testimonials" },
];

/** Active when the path is the link, or nested under it (except Home). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Rotating promo line that scrolls above the nav and recedes on scroll.
const ANNOUNCEMENTS = [
  "Complimentary shipping over ₹2,000",
  "Autumn — Winter 26",
  "Crafted to last",
  "Made in India",
];

export function StoreHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((state) => state.items);
  const openCart = useCart((state) => state.setOpen);
  const count = mounted ? cartCount(items) : 0;
  const wishlistItems = useWishlist((state) => state.items);
  const savedCount = mounted ? wishlistCount(wishlistItems) : 0;

  useEffect(() => setMounted(true), []);

  // The homepage has a full-bleed hero, so the bar starts transparent there.
  const overHero = pathname === "/";

  // Passive scroll listener; setState no-ops when the boolean is unchanged, so
  // this is cheap and never thrashes React between renders.
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const solid = scrolled || !overHero || menuOpen;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* Announcement marquee — recedes as the page scrolls */}
        <div
          aria-hidden={scrolled}
          className={cn(
            "overflow-hidden transition-[height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "border-gold/15 border-b bg-[#0c0c0d]/90 backdrop-blur-md",
            scrolled ? "h-0 opacity-0" : "h-9 opacity-100",
          )}
        >
          <div className="relative flex h-9 items-center overflow-hidden">
            {/* Premium light beam drifting across the announcement */}
            <span
              aria-hidden
              className="dope-lightsweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(216,194,153,0.16),transparent)] blur-md"
            />
            <Marquee />
          </div>
        </div>

        {/* Navigation */}
        <div
          className={cn(
            "transition-colors duration-500",
            solid
              ? "bg-background/75 border-border border-b backdrop-blur-xl"
              : "bg-transparent",
          )}
        >
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:h-20 sm:px-8">
            {/* Left: mobile toggle + desktop nav */}
            <div className="flex flex-1 items-center">
              <button
                type="button"
                className="text-foreground -ml-1 p-1 sm:hidden"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
              >
                {menuOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>

              <nav className="hidden items-center gap-9 sm:flex">
                {NAV.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    active={isActive(pathname, item.href)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Center: wordmark */}
            <Link
              href="/"
              aria-label="Dope Store home"
              className="group absolute left-1/2 -translate-x-1/2"
            >
              <span className="font-display text-foreground text-xl leading-none font-medium tracking-[0.38em] transition-[letter-spacing] duration-500 group-hover:tracking-[0.44em] sm:text-2xl">
                DOPE
              </span>
            </Link>

            {/* Right: account + cart */}
            <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
              <Link
                href="/search"
                aria-label="Search"
                className="text-foreground/85 hover:text-foreground group p-1 transition-colors"
              >
                <Search
                  className="size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </Link>
              <Link
                href="/wishlist"
                aria-label={`Wishlist${savedCount > 0 ? `, ${savedCount} saved` : ""}`}
                className="text-foreground/85 hover:text-foreground group relative p-1 transition-colors"
              >
                <Heart
                  className="size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
                  strokeWidth={1.5}
                />
                {savedCount > 0 ? (
                  <span className="bg-gold text-background absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums">
                    {savedCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/account"
                aria-label="Your account"
                className="text-foreground/85 hover:text-foreground group p-1 transition-colors"
              >
                <User
                  className="size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
                  strokeWidth={1.5}
                />
              </Link>
              <button
                type="button"
                onClick={() => openCart(true)}
                aria-label={`Open bag${count > 0 ? `, ${count} items` : ""}`}
                className="text-foreground/85 hover:text-foreground group relative p-1 transition-colors"
              >
                <ShoppingBag
                  className="size-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
                  strokeWidth={1.5}
                />
                {count > 0 ? (
                  <span className="bg-gold text-background absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums">
                    {count}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {menuOpen ? (
              <motion.nav
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="border-border bg-background/95 border-b px-5 pb-6 backdrop-blur-xl sm:hidden"
              >
                <div className="flex flex-col pt-2">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-foreground/80 hover:text-foreground border-border/60 border-b py-4 text-sm font-medium tracking-[0.16em] uppercase transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/account"
                    className="text-foreground/80 hover:text-foreground py-4 text-sm font-medium tracking-[0.16em] uppercase transition-colors"
                  >
                    Account
                  </Link>
                </div>
              </motion.nav>
            ) : null}
          </AnimatePresence>
        </div>
      </header>
      <CartDrawer />
    </>
  );
}

/** Desktop nav link with an elegant gold underline that wipes in on hover. */
function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative text-[13px] font-medium tracking-[0.16em] uppercase transition-colors",
        active ? "text-foreground" : "text-foreground/70 hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "bg-gold absolute -bottom-1.5 left-0 h-px origin-left transition-transform duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          active
            ? "w-full scale-x-100"
            : "w-full scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}

/** Seamless two-track marquee of promo lines (paused for reduced motion). */
function Marquee() {
  return (
    <div className="flex w-full overflow-hidden select-none">
      {[0, 1].map((track) => (
        <div
          key={track}
          aria-hidden={track === 1}
          className="dope-marquee flex shrink-0 items-center gap-8 pr-8"
        >
          {ANNOUNCEMENTS.map((message) => (
            <span
              key={message}
              className="text-gold/80 flex items-center gap-8 text-[10px] font-medium tracking-[0.28em] whitespace-nowrap uppercase"
            >
              {message}
              <span className="bg-gold/40 size-1 rounded-full" />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
