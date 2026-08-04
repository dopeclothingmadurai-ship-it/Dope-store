"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, User, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { CartDrawer } from "./cart-drawer";
import { cartCount, useCart } from "./use-cart";

const NAV = [{ label: "Shop", href: "/shop" }];

export function StoreHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useCart((state) => state.items);
  const openCart = useCart((state) => state.setOpen);
  const count = mounted ? cartCount(items) : 0;

  useEffect(() => setMounted(true), []);

  // The homepage has a full-bleed hero, so the bar starts transparent there.
  const overHero = pathname === "/";

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
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
          solid
            ? "bg-background/80 border-border border-b backdrop-blur-xl"
            : "bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:h-20 sm:px-8">
          <button
            type="button"
            className="text-foreground -ml-1 p-1 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <nav className="hidden flex-1 items-center gap-8 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/75 hover:text-foreground text-[13px] font-medium tracking-[0.14em] uppercase transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/"
            aria-label="Dope Store home"
            className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2.5"
          >
            <Image
              src="/dope-logo.png"
              alt="Dope Store"
              width={40}
              height={40}
              priority
              className="size-8 sm:size-9"
            />
            <span className="font-display text-foreground text-xl leading-none font-medium tracking-[0.32em] sm:text-2xl">
              DOPE
            </span>
          </Link>

          <div className="flex flex-1 items-center justify-end gap-1">
            <Link
              href="/account"
              aria-label="Your account"
              className="text-foreground/85 hover:text-foreground p-1 transition-colors"
            >
              <User className="size-5" strokeWidth={1.5} />
            </Link>
            <button
              type="button"
              onClick={() => openCart(true)}
              aria-label={`Open bag${count > 0 ? `, ${count} items` : ""}`}
              className="text-foreground/85 hover:text-foreground relative -mr-1 p-1 transition-colors"
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              {count > 0 ? (
                <span className="bg-gold text-background absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums">
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
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="border-border bg-background border-b px-5 pb-6 sm:hidden"
            >
              <div className="flex flex-col gap-1 pt-2">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-foreground/80 hover:text-foreground py-3 text-sm font-medium tracking-[0.14em] uppercase transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </header>
      <CartDrawer />
    </>
  );
}
