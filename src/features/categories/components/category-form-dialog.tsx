"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
import { SingleImageUpload } from "@/components/admin/single-image-upload";
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
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { slugify } from "@/lib/slug";

import { createCategoryAction, updateCategoryAction } from "../actions";
import { categoryFormSchema, type CategoryFormValues } from "../schema";
import { type Category } from "../types";

const EMPTY: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: null,
  position: 0,
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}) {
  const isEdit = category !== null;
  const [slugDirty, setSlugDirty] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) return;
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        imageUrl: category.image_url,
        position: category.position,
      });
      setSlugDirty(true);
    } else {
      reset(EMPTY);
      setSlugDirty(false);
    }
  }, [open, category, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateCategoryAction(category.id, values)
      : await createCategoryAction(values);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    toast.success(isEdit ? "Category updated" : "Category created");
    onOpenChange(false);
    onSaved();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this category's details."
              : "Create a new single-level category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow
            label="Name"
            htmlFor="cat-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="cat-name"
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
            htmlFor="cat-slug"
            required
            error={errors.slug?.message}
          >
            <Input
              id="cat-slug"
              {...register("slug", {
                onChange: (event) => {
                  setSlugDirty(true);
                  setValue("slug", slugify(event.target.value));
                },
              })}
            />
          </FormRow>

          <FormRow
            label="Description"
            htmlFor="cat-description"
            error={errors.description?.message}
          >
            <Textarea
              id="cat-description"
              rows={3}
              {...register("description")}
            />
          </FormRow>

          <FormRow label="Image" error={errors.imageUrl?.message}>
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <SingleImageUpload
                  folder="categories"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </FormRow>

          <FormRow
            label="Position"
            htmlFor="cat-position"
            hint="Lower numbers appear first."
            error={errors.position?.message}
          >
            <Input
              id="cat-position"
              type="number"
              min={0}
              className="w-28"
              {...register("position", { valueAsNumber: true })}
            />
          </FormRow>

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
