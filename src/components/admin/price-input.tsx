"use client";

import { Input } from "@/components/ui/input";
import { rupeesToPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * Money input. Displays and accepts rupees, but reports the value to the form
 * as integer paise. `allowNull` lets the field be cleared (e.g. compare-at).
 */
export function PriceInput({
  id,
  value,
  onChange,
  allowNull = false,
  placeholder = "0.00",
  className,
}: {
  id?: string;
  value: number | null;
  onChange: (paise: number | null) => void;
  allowNull?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const display = value === null ? "" : String(value / 100);

  return (
    <div className={cn("relative", className)}>
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm">
        ₹
      </span>
      <Input
        id={id}
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        className="pl-6"
        placeholder={placeholder}
        value={display}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") {
            onChange(allowNull ? null : 0);
            return;
          }
          const parsed = Number(raw);
          if (Number.isNaN(parsed)) return;
          onChange(rupeesToPaise(parsed));
        }}
      />
    </div>
  );
}
