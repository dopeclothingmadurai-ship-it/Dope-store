"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
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
import { applyServerErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { adjustInventoryAction } from "../actions";
import { inventoryAdjustSchema, type InventoryAdjustValues } from "../schema";
import { type VariantWithInventory } from "../types";

const REASONS: { value: InventoryAdjustValues["reason"]; label: string }[] = [
  { value: "restock", label: "Restock" },
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "correction", label: "Correction" },
  { value: "return", label: "Return" },
];

const EMPTY: InventoryAdjustValues = {
  delta: 0,
  reason: "restock",
  reference: "",
};

export function InventoryAdjustDialog({
  open,
  onOpenChange,
  productId,
  variant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  variant: VariantWithInventory | null;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InventoryAdjustValues>({
    resolver: zodResolver(inventoryAdjustSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (!variant) return;
    const result = await adjustInventoryAction(productId, variant.id, values);
    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }
    toast.success(`Stock updated — now ${result.data.quantity}`);
    onOpenChange(false);
    onSaved();
  });

  const current = variant?.inventory?.quantity ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {variant
              ? `${variant.sku} — on hand ${current}. Enter a positive or negative amount.`
              : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow
            label="Change"
            htmlFor="inv-delta"
            hint="Positive to add stock, negative to remove."
            required
            error={errors.delta?.message}
          >
            <Input
              id="inv-delta"
              type="number"
              {...register("delta", { valueAsNumber: true })}
            />
          </FormRow>

          <FormRow
            label="Reason"
            htmlFor="inv-reason"
            error={errors.reason?.message}
          >
            <select
              id="inv-reason"
              className={cn(
                "border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              )}
              {...register("reason")}
            >
              {REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow
            label="Reference"
            htmlFor="inv-reference"
            hint="Optional note (e.g. PO number)."
            error={errors.reference?.message}
          >
            <Input id="inv-reference" {...register("reference")} />
          </FormRow>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
