"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PriceInput } from "@/components/admin/price-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { bulkPreviewAction, bulkPriceAction } from "../bulk-actions";
import { type BulkPriceMode } from "../bulk-schema";
import { type BulkProductSummary } from "../types";

const MODES: { value: BulkPriceMode; label: string; percent: boolean }[] = [
  { value: "increase_pct", label: "Increase by %", percent: true },
  { value: "decrease_pct", label: "Decrease by %", percent: true },
  { value: "increase_fixed", label: "Increase by ₹", percent: false },
  { value: "decrease_fixed", label: "Decrease by ₹", percent: false },
  { value: "set_exact", label: "Set exact price", percent: false },
];

function computeNewPrice(
  base: number,
  mode: BulkPriceMode,
  value: number,
): number {
  switch (mode) {
    case "increase_pct":
      return Math.max(0, Math.round(base * (1 + value / 100)));
    case "decrease_pct":
      return Math.max(0, Math.round(base * (1 - value / 100)));
    case "increase_fixed":
      return Math.max(0, base + value);
    case "decrease_fixed":
      return Math.max(0, base - value);
    case "set_exact":
      return Math.max(0, value);
  }
}

export function BulkPriceDialog({
  open,
  onOpenChange,
  ids,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ids: string[];
  onDone: () => void;
}) {
  const [mode, setMode] = useState<BulkPriceMode>("increase_pct");
  const [value, setValue] = useState(10);
  const [summaries, setSummaries] = useState<BulkProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPercent = MODES.find((m) => m.value === mode)?.percent ?? false;

  useEffect(() => {
    if (!open) return;
    setMode("increase_pct");
    setValue(10);
    setLoading(true);
    bulkPreviewAction(ids).then((res) => {
      if (res.ok) setSummaries(res.data);
      setLoading(false);
    });
  }, [open, ids]);

  async function apply() {
    setSaving(true);
    const res = await bulkPriceAction(ids, { mode, value });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Updated ${res.data} product${res.data === 1 ? "" : "s"}`);
    onOpenChange(false);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk price update</DialogTitle>
          <DialogDescription>
            Applies to {ids.length} selected product
            {ids.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setMode(option.value);
                  setValue(option.percent ? 10 : 0);
                }}
                className={cn(
                  "h-9 rounded-lg border px-3 text-sm transition-colors",
                  mode === option.value
                    ? "border-white/20 bg-white/[0.08] text-white"
                    : "border-input text-muted-foreground hover:bg-white/[0.03]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs font-medium">
              {isPercent ? "Percentage" : "Amount"}
            </label>
            {isPercent ? (
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={value}
                  onChange={(event) =>
                    setValue(Number(event.target.value) || 0)
                  }
                  className="pr-7"
                />
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm">
                  %
                </span>
              </div>
            ) : (
              <PriceInput value={value} onChange={(v) => setValue(v ?? 0)} />
            )}
          </div>

          <div className="rounded-xl border">
            <div className="text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
              <span>Preview</span>
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {summaries.map((product) => {
                    const next = computeNewPrice(
                      product.basePrice,
                      mode,
                      value,
                    );
                    const changed = next !== product.basePrice;
                    return (
                      <tr
                        key={product.id}
                        className="border-border/60 border-b last:border-0"
                      >
                        <td className="truncate px-3 py-2">{product.title}</td>
                        <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                          {formatPaise(product.basePrice)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium tabular-nums",
                            changed
                              ? "text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {formatPaise(next)}
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && summaries.length === 0 ? (
                    <tr>
                      <td
                        className="text-muted-foreground px-3 py-4 text-center"
                        colSpan={3}
                      >
                        No products to preview.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>
            Cancel
          </DialogClose>
          <Button onClick={apply} disabled={saving || loading}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Apply to {ids.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
