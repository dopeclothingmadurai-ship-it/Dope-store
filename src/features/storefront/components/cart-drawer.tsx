"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageIcon, Minus, Plus, X } from "lucide-react";

import { formatPaise } from "@/lib/money";

import { cartSubtotal, useCart } from "./use-cart";

export function CartDrawer() {
  const { items, open, setOpen, setQuantity, remove } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll and close on Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  const list = mounted ? items : [];
  const subtotal = cartSubtotal(list);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-heading"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-background border-border absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l"
          >
            <div className="border-border flex items-center justify-between border-b px-6 py-5">
              <h2
                id="cart-drawer-heading"
                className="text-sm font-medium tracking-[0.18em] uppercase"
              >
                Your Bag
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close bag"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {list.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-muted-foreground text-sm">
                  Your bag is empty.
                </p>
                <Link
                  href="/shop"
                  onClick={() => setOpen(false)}
                  className="border-foreground/30 hover:border-foreground border-b pb-0.5 text-[13px] font-medium tracking-[0.16em] uppercase transition-colors"
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 divide-y divide-[color:var(--border)] overflow-y-auto px-6">
                  {list.map((item) => (
                    <div key={item.variantId} className="flex gap-4 py-5">
                      <div className="bg-secondary relative aspect-[3/4] w-20 shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="text-muted-foreground/40 flex h-full items-center justify-center">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm">{item.title}</p>
                            {item.size ? (
                              <p className="text-muted-foreground mt-0.5 text-xs tracking-wide uppercase">
                                Size {item.size}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(item.variantId)}
                            className="text-muted-foreground hover:text-foreground text-xs"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="border-border flex items-center gap-3 border px-2 py-1">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() =>
                                setQuantity(item.variantId, item.quantity - 1)
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <span className="w-4 text-center text-sm tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() =>
                                setQuantity(item.variantId, item.quantity + 1)
                              }
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>
                          <span className="text-sm tabular-nums">
                            {formatPaise(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-border space-y-4 border-t px-6 py-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground tracking-wide uppercase">
                      Subtotal
                    </span>
                    <span className="tabular-nums">
                      {formatPaise(subtotal)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <button
                    type="button"
                    disabled
                    title="Secure checkout is coming soon"
                    className="bg-foreground text-background h-12 w-full cursor-not-allowed text-[13px] font-medium tracking-[0.18em] uppercase opacity-70"
                  >
                    Checkout — coming soon
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
