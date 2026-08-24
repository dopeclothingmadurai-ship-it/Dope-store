"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Star } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { cn } from "@/lib/utils";

import { createTestimonialAction, updateTestimonialAction } from "../actions";
import { testimonialFormSchema, type TestimonialFormValues } from "../schema";
import { type Testimonial } from "../types";

const EMPTY: TestimonialFormValues = {
  customerName: "",
  review: "",
  rating: 5,
  location: "",
  avatarUrl: "",
  verifiedPurchase: true,
  featured: false,
  status: "approved",
  position: 0,
};

const numberFieldClass = cn(
  "border-input dark:bg-input/30 h-9 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
);

export function TestimonialFormDialog({
  open,
  onOpenChange,
  testimonial,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial: Testimonial | null;
  onSaved: () => void;
}) {
  const isEdit = testimonial !== null;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      testimonial
        ? {
            customerName: testimonial.customer_name,
            review: testimonial.review,
            rating: testimonial.rating,
            location: testimonial.location ?? "",
            avatarUrl: testimonial.avatar_url ?? "",
            verifiedPurchase: testimonial.verified_purchase,
            featured: testimonial.featured,
            status:
              testimonial.status === "approved" ||
              testimonial.status === "rejected"
                ? testimonial.status
                : "pending",
            position: testimonial.position,
          }
        : EMPTY,
    );
  }, [open, testimonial, reset]);

  const rating = watch("rating");

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateTestimonialAction(testimonial.id, values)
      : await createTestimonialAction(values);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    toast.success(isEdit ? "Testimonial updated" : "Testimonial added");
    onOpenChange(false);
    onSaved();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit testimonial" : "New testimonial"}
          </DialogTitle>
          <DialogDescription>
            Curated customer testimonials shown on the storefront homepage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormRow
              label="Customer name"
              htmlFor="t-name"
              required
              error={errors.customerName?.message}
            >
              <Input
                id="t-name"
                placeholder="Aarav Mehta"
                {...register("customerName")}
              />
            </FormRow>
            <FormRow
              label="Location"
              htmlFor="t-location"
              error={errors.location?.message}
              hint="City, country — optional"
            >
              <Input
                id="t-location"
                placeholder="Mumbai, IN"
                {...register("location")}
              />
            </FormRow>
          </div>

          <FormRow
            label="Review"
            htmlFor="t-review"
            required
            error={errors.review?.message}
          >
            <Textarea
              id="t-review"
              rows={4}
              placeholder="The fit and fabric are exceptional…"
              {...register("review")}
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Rating" error={errors.rating?.message}>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    onClick={() =>
                      setValue("rating", value, { shouldValidate: true })
                    }
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "size-5 transition-colors",
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  </button>
                ))}
              </div>
            </FormRow>

            <FormRow
              label="Order"
              htmlFor="t-position"
              error={errors.position?.message}
              hint="Lower shows first"
            >
              <input
                id="t-position"
                type="number"
                min={0}
                className={numberFieldClass}
                {...register("position")}
              />
            </FormRow>
          </div>

          <FormRow
            label="Avatar URL"
            htmlFor="t-avatar"
            error={errors.avatarUrl?.message}
            hint="Optional — leave blank for initials"
          >
            <Input
              id="t-avatar"
              placeholder="https://…"
              {...register("avatarUrl")}
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="verifiedPurchase"
              render={({ field }) => (
                <ToggleRow
                  label="Verified purchase"
                  hint="Show the verified badge"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <ToggleRow
                  label="Featured"
                  hint="Pin to the front"
                  checked={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {(["pending", "approved", "rejected"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => field.onChange(option)}
                    className={cn(
                      "h-9 rounded-lg border text-sm capitalize transition-colors",
                      field.value === option
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-input text-muted-foreground hover:bg-white/[0.03]",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          />

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="border-input flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
