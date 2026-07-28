"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
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
import { applyServerErrors } from "@/lib/forms";

import { createVariantAction, updateVariantAction } from "../actions";
import { variantFormSchema, type VariantFormValues } from "../schema";
import { type VariantWithInventory } from "../types";

const EMPTY: VariantFormValues = {
  sku: "",
  barcode: "",
  size: "",
  color: "",
  priceOverride: null,
  weightGrams: null,
};

export function VariantFormDialog({
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
  const isEdit = variant !== null;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      variant
        ? {
            sku: variant.sku,
            barcode: variant.barcode ?? "",
            size: variant.size ?? "",
            color: variant.color ?? "",
            priceOverride: variant.price_override,
            weightGrams: variant.weight_grams,
          }
        : EMPTY,
    );
  }, [open, variant, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateVariantAction(productId, variant.id, values)
      : await createVariantAction(productId, values);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    toast.success(isEdit ? "Variant updated" : "Variant added");
    onOpenChange(false);
    onSaved();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit variant" : "Add variant"}</DialogTitle>
          <DialogDescription>
            Stock is managed separately from the Inventory column.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <FormRow
            label="SKU"
            htmlFor="v-sku"
            required
            error={errors.sku?.message}
            className="sm:col-span-2"
          >
            <Input id="v-sku" {...register("sku")} />
          </FormRow>

          <FormRow
            label="Barcode"
            htmlFor="v-barcode"
            error={errors.barcode?.message}
          >
            <Input id="v-barcode" {...register("barcode")} />
          </FormRow>

          <FormRow
            label="Weight (grams)"
            htmlFor="v-weight"
            error={errors.weightGrams?.message}
          >
            <Controller
              control={control}
              name="weightGrams"
              render={({ field }) => (
                <Input
                  id="v-weight"
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                />
              )}
            />
          </FormRow>

          <FormRow label="Size" htmlFor="v-size" error={errors.size?.message}>
            <Input id="v-size" {...register("size")} />
          </FormRow>

          <FormRow
            label="Color"
            htmlFor="v-color"
            error={errors.color?.message}
          >
            <Input id="v-color" {...register("color")} />
          </FormRow>

          <FormRow
            label="Price override"
            hint="Leave empty to use the product price."
            error={errors.priceOverride?.message}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="priceOverride"
              render={({ field }) => (
                <PriceInput
                  value={field.value}
                  onChange={field.onChange}
                  allowNull
                />
              )}
            />
          </FormRow>

          <DialogFooter className="sm:col-span-2">
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save" : "Add variant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
