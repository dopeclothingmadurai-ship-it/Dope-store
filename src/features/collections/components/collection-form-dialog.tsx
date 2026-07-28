"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { applyServerErrors } from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

import { createCollectionAction, updateCollectionAction } from "../actions";
import { collectionFormSchema, type CollectionFormValues } from "../schema";
import { type Collection } from "../types";

const EMPTY: CollectionFormValues = {
  name: "",
  slug: "",
  type: "manual",
  isFeatured: false,
};

export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
  onSaved: () => void;
}) {
  const isEdit = collection !== null;
  const [slugDirty, setSlugDirty] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (!open) return;
    if (collection) {
      reset({
        name: collection.name,
        slug: collection.slug,
        type: collection.type,
        isFeatured: collection.is_featured,
      });
      setSlugDirty(true);
    } else {
      reset(EMPTY);
      setSlugDirty(false);
    }
  }, [open, collection, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateCollectionAction(collection.id, values)
      : await createCollectionAction(values);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    toast.success(isEdit ? "Collection updated" : "Collection created");
    onOpenChange(false);
    onSaved();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit collection" : "New collection"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this collection's details."
              : "Create a collection to group products."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow
            label="Name"
            htmlFor="col-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="col-name"
              {...register("name", {
                onChange: (event) => {
                  if (!slugDirty) {
                    setValue("slug", slugify(event.target.value), {
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
          </FormRow>

          <FormRow
            label="Slug"
            htmlFor="col-slug"
            required
            error={errors.slug?.message}
          >
            <Input
              id="col-slug"
              {...register("slug", {
                onChange: (event) => {
                  setSlugDirty(true);
                  setValue("slug", slugify(event.target.value));
                },
              })}
            />
          </FormRow>

          <FormRow label="Type" htmlFor="col-type" error={errors.type?.message}>
            <select
              id="col-type"
              className={cn(
                "border-input dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none",
                "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
              )}
              {...register("type")}
            >
              <option value="manual">Manual</option>
              <option value="automated">Automated</option>
            </select>
          </FormRow>

          <Controller
            control={control}
            name="isFeatured"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Featured</p>
                  <p className="text-muted-foreground text-xs">
                    Highlight this collection on the storefront.
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            )}
          />

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
