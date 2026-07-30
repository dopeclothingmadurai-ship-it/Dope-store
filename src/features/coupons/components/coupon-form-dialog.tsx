"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";
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
import { formatPaise } from "@/lib/money";
import { applyServerErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { createCouponAction, updateCouponAction } from "../actions";
import { couponFormSchema, type CouponFormValues } from "../schema";
import { type Coupon } from "../types";

const EMPTY: CouponFormValues = {
  code: "",
  description: null,
  type: "percentage",
  value: 10,
  minOrder: 0,
  maxDiscount: null,
  usageLimit: null,
  perCustomerLimit: null,
  startsAt: null,
  endsAt: null,
};

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `DOPE-${suffix}`;
}

const numberFieldClass = cn(
  "border-input dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
);

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onSaved: () => void;
}) {
  const isEdit = coupon !== null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    if (coupon) {
      reset({
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minOrder: coupon.min_order,
        maxDiscount: coupon.max_discount,
        usageLimit: coupon.usage_limit,
        perCustomerLimit: coupon.per_customer_limit,
        startsAt: isoToLocalInput(coupon.starts_at),
        endsAt: isoToLocalInput(coupon.ends_at),
      });
    } else {
      reset(EMPTY);
    }
  }, [open, coupon, reset]);

  const type = watch("type");
  const value = watch("value");
  const minOrder = watch("minOrder");
  const maxDiscount = watch("maxDiscount");

  const onSubmit = handleSubmit(async (values) => {
    const payload: CouponFormValues = {
      ...values,
      startsAt: values.startsAt
        ? new Date(values.startsAt).toISOString()
        : null,
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
    };
    const result = isEdit
      ? await updateCouponAction(coupon.id, payload)
      : await createCouponAction(payload);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    toast.success(isEdit ? "Coupon updated" : "Coupon created");
    onOpenChange(false);
    onSaved();
  });

  const previewDiscount =
    type === "percentage"
      ? `${value || 0}% off`
      : `${formatPaise(value || 0)} off`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this discount code."
              : "Create a discount code for checkout and point of sale."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow
            label="Code"
            htmlFor="coupon-code"
            required
            error={errors.code?.message}
          >
            <div className="flex gap-2">
              <Input
                id="coupon-code"
                className="font-mono uppercase"
                placeholder="DOPE-SUMMER"
                {...register("code")}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setValue("code", generateCode(), { shouldValidate: true })
                }
              >
                <Sparkles /> Generate
              </Button>
            </div>
          </FormRow>

          <FormRow
            label="Description"
            htmlFor="coupon-description"
            error={errors.description?.message}
            hint="Internal note — not shown to customers."
          >
            <Input
              id="coupon-description"
              placeholder="Summer launch promo"
              {...register("description")}
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Type" error={errors.type?.message}>
              <div className="grid grid-cols-2 gap-2">
                {(["percentage", "fixed"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setValue("type", option);
                      setValue("value", option === "percentage" ? 10 : 0, {
                        shouldValidate: true,
                      });
                    }}
                    className={cn(
                      "h-9 rounded-lg border text-sm transition-colors",
                      type === option
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-input text-muted-foreground hover:bg-white/[0.03]",
                    )}
                  >
                    {option === "percentage" ? "Percentage" : "Fixed"}
                  </button>
                ))}
              </div>
            </FormRow>

            <FormRow
              label={type === "percentage" ? "Percentage" : "Amount"}
              htmlFor="coupon-value"
              required
              error={errors.value?.message}
            >
              {type === "percentage" ? (
                <div className="relative">
                  <Input
                    id="coupon-value"
                    type="number"
                    min={1}
                    max={100}
                    className="pr-7"
                    {...register("value")}
                  />
                  <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm">
                    %
                  </span>
                </div>
              ) : (
                <Controller
                  control={control}
                  name="value"
                  render={({ field }) => (
                    <PriceInput
                      id="coupon-value"
                      value={field.value ?? 0}
                      onChange={(paise) => field.onChange(paise ?? 0)}
                    />
                  )}
                />
              )}
            </FormRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormRow
              label="Minimum order"
              error={errors.minOrder?.message}
              hint="0 = no minimum"
            >
              <Controller
                control={control}
                name="minOrder"
                render={({ field }) => (
                  <PriceInput
                    value={field.value ?? 0}
                    onChange={(paise) => field.onChange(paise ?? 0)}
                  />
                )}
              />
            </FormRow>

            <FormRow
              label="Max discount"
              error={errors.maxDiscount?.message}
              hint="Cap for % coupons"
            >
              <Controller
                control={control}
                name="maxDiscount"
                render={({ field }) => (
                  <PriceInput
                    allowNull
                    value={field.value}
                    onChange={(paise) => field.onChange(paise)}
                  />
                )}
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormRow
              label="Usage limit"
              htmlFor="coupon-usage"
              error={errors.usageLimit?.message}
              hint="Blank = unlimited"
            >
              <input
                id="coupon-usage"
                type="number"
                min={1}
                placeholder="∞"
                className={numberFieldClass}
                {...register("usageLimit", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
              />
            </FormRow>

            <FormRow
              label="Per customer"
              htmlFor="coupon-per-customer"
              error={errors.perCustomerLimit?.message}
              hint="Blank = unlimited"
            >
              <input
                id="coupon-per-customer"
                type="number"
                min={1}
                placeholder="∞"
                className={numberFieldClass}
                {...register("perCustomerLimit", {
                  setValueAs: (v) => (v === "" ? null : Number(v)),
                })}
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormRow
              label="Starts"
              htmlFor="coupon-starts"
              error={errors.startsAt?.message}
            >
              <input
                id="coupon-starts"
                type="datetime-local"
                className={numberFieldClass}
                {...register("startsAt")}
              />
            </FormRow>
            <FormRow
              label="Ends"
              htmlFor="coupon-ends"
              error={errors.endsAt?.message}
            >
              <input
                id="coupon-ends"
                type="datetime-local"
                className={numberFieldClass}
                {...register("endsAt")}
              />
            </FormRow>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-dashed p-4">
            <p className="text-muted-foreground mb-1 text-xs tracking-wide uppercase">
              Preview
            </p>
            <p className="text-sm font-medium text-white">
              {previewDiscount}
              {type === "percentage" && maxDiscount
                ? ` · up to ${formatPaise(maxDiscount)}`
                : ""}
              {minOrder ? ` · min ${formatPaise(minOrder)}` : ""}
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
