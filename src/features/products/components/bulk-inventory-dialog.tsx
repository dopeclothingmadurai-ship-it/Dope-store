"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";

import { bulkInventoryAction, bulkPreviewAction } from "../bulk-actions";
import { type BulkInventoryMode } from "../bulk-schema";
import { type BulkProductSummary } from "../types";

const MODES: { value: BulkInventoryMode; label: string }[] = [
  { value: "set", label: "Set stock" },
  { value: "increase", label: "Increase" },
  { value: "decrease", label: "Decrease" },
];

/** Preview each product's new TOTAL stock. Stock is per-variant, so "set" and
 *  the deltas apply to every variant of the product. */
function computeNewStock(
  product: BulkProductSummary,
  mode: BulkInventoryMode,
  value: number,
): number {
  const variants = Math.max(1, product.variantCount);
  switch (mode) {
    case "set":
      return value * variants;
    case "increase":
      return product.stock + value * variants;
    case "decrease":
      return Math.max(0, product.stock - value * variants);
  }
}

export function BulkInventoryDialog({
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
  const [mode, setMode] = useState<BulkInventoryMode>("set");
  const [value, setValue] = useState(0);
  const [summaries, setSummaries] = useState<BulkProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("set");
    setValue(0);
    setLoading(true);
    bulkPreviewAction(ids).then((res) => {
      if (res.ok) setSummaries(res.data);
      setLoading(false);
    });
  }, [open, ids]);

  async function apply() {
    setSaving(true);
    const res = await bulkInventoryAction(ids, { mode, value });
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(
      `Updated stock across ${res.data} variant${res.data === 1 ? "" : "s"}`,
    );
    onOpenChange(false);
    onDone();
  }

  const multiVariant = summaries.some((product) => product.variantCount > 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk inventory update</DialogTitle>
          <DialogDescription>
            Applies to every variant of {ids.length} selected product
            {ids.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMode(option.value)}
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
              Quantity {mode === "set" ? "per variant" : "change per variant"}
            </label>
            <Input
              type="number"
              min={0}
              value={value}
              onChange={(event) => setValue(Number(event.target.value) || 0)}
            />
          </div>

          <div className="rounded-xl border">
            <div className="text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs font-medium">
              <span>Preview · total stock</span>
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : null}
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <tbody>
                  {summaries.map((product) => {
                    const next = computeNewStock(product, mode, value);
                    const changed = next !== product.stock;
                    return (
                      <tr
                        key={product.id}
                        className="border-border/60 border-b last:border-0"
                      >
                        <td className="truncate px-3 py-2">
                          {product.title}
                          {product.variantCount > 1 ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {product.variantCount} variants
                            </span>
                          ) : null}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                          {product.stock}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium tabular-nums",
                            changed
                              ? "text-emerald-400"
                              : "text-muted-foreground",
                          )}
                        >
                          {next}
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
            {multiVariant && mode === "decrease" ? (
              <p className="text-muted-foreground border-t px-3 py-2 text-xs">
                Decreases never drop a variant below zero, so multi-variant
                totals may end higher than the preview.
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>
            Cancel
          </DialogClose>
          <Button onClick={apply} disabled={saving || loading || value === 0}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
