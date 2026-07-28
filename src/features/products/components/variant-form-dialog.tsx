"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
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
import { generateSku } from "@/lib/sku";

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
  productTitle,
  existingSkus,
  variant,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  existingSkus: string[];
  variant: VariantWithInventory | null;
  onSaved: () => void;
}) {
  const isEdit = variant !== null;
  // Once the admin edits the SKU we never overwrite it automatically again.
  const [skuTouched, setSkuTouched] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    if (variant) {
      reset({
        sku: variant.sku,
        barcode: variant.barcode ?? "",
        size: variant.size ?? "",
        color: variant.color ?? "",
        priceOverride: variant.price_override,
        weightGrams: variant.weight_grams,
      });
      setSkuTouched(true);
    } else {
      reset({
        ...EMPTY,
        sku: generateSku(productTitle, null, null, existingSkus),
      });
      setSkuTouched(false);
    }
  }, [open, variant, reset, productTitle, existingSkus]);

  // Keep the SKU in sync with color/size while it is still auto-generated.
  function regenerateSku(nextColor: string, nextSize: string) {
    if (isEdit || skuTouched) return;
    setValue(
      "sku",
      generateSku(productTitle, nextColor, nextSize, existingSkus),
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateVariantAction(productId, variant.id, values)
      : await createVariantAction(productId, values, !skuTouched);

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
            hint="Generated automatically. Edit to set a custom SKU."
            error={errors.sku?.message}
            className="sm:col-span-2"
          >
            <Input
              id="v-sku"
              className="font-mono"
              {...register("sku", { onChange: () => setSkuTouched(true) })}
            />
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
            <Input
              id="v-size"
              {...register("size", {
                onChange: (event) =>
                  regenerateSku(getValues("color") ?? "", event.target.value),
              })}
            />
          </FormRow>

          <FormRow
            label="Color"
            htmlFor="v-color"
            error={errors.color?.message}
          >
            <Input
              id="v-color"
              {...register("color", {
                onChange: (event) =>
                  regenerateSku(event.target.value, getValues("size") ?? ""),
              })}
            />
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
