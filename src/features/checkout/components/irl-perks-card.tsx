"use client";

import { useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";

export function IrlPerksCard({
  code,
  orderNumber,
  orderDate,
  orderTime,
}: {
  code: string;
  orderNumber: string;
  orderDate: string;
  orderTime: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border-gold/30 relative overflow-hidden rounded-2xl border bg-[radial-gradient(120%_120%_at_50%_0%,rgba(194,164,104,0.12)_0%,transparent_60%)] p-7 sm:p-9">
      <div className="text-gold flex items-center gap-2 text-[11px] font-medium tracking-[0.3em] uppercase">
        <Sparkles className="size-4" /> IRL Perks
      </div>

      <button
        type="button"
        onClick={copy}
        aria-label="Copy IRL Perks code"
        className="border-gold/40 hover:border-gold group mt-5 flex w-full items-center justify-between gap-4 rounded-xl border border-dashed px-5 py-4 transition-colors"
      >
        <span className="font-mono text-2xl tracking-[0.15em] text-white sm:text-3xl">
          {code}
        </span>
        <span className="text-gold flex items-center gap-1.5 text-[11px] font-medium tracking-[0.16em] uppercase">
          {copied ? (
            <>
              <Check className="size-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="size-4" /> Copy
            </>
          )}
        </span>
      </button>

      <p className="text-muted-foreground mt-5 text-sm leading-relaxed">
        Use this IRL Perks code while collecting your order at Dope Store to
        unlock your exclusive in-store offer.
      </p>

      <div className="border-border mt-6 grid grid-cols-3 gap-4 border-t pt-5">
        <Meta label="Order" value={orderNumber} />
        <Meta label="Date" value={orderDate} />
        <Meta label="Time" value={orderTime} />
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground/70 text-[10px] font-medium tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
