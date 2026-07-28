"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormRow } from "@/components/admin/form-row";
import { PriceInput } from "@/components/admin/price-input";
import { TagsInput } from "@/components/admin/tags-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { applyServerErrors } from "@/lib/forms";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

import { createProductAction, updateProductAction } from "../actions";
import { productFormSchema, type ProductFormValues } from "../schema";
import { type ProductDetail } from "../types";

type Option = { id: string; name: string };

const selectClass = cn(
  "border-input bg-transparent dark:bg-input/30 h-8 w-full rounded-lg border px-2.5 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
);

function toDefaults(product: ProductDetail | null): ProductFormValues {
  if (!product) {
    return {
      title: "",
      slug: "",
      description: "",
      brand: "",
      categoryId: null,
      status: "draft",
      seoTitle: "",
      seoDescription: "",
      basePrice: 0,
      compareAtPrice: null,
      featured: false,
      tags: [],
      collectionIds: [],
    };
  }
  return {
    title: product.title,
    slug: product.slug,
    description: product.description ?? "",
    brand: product.brand ?? "",
    categoryId: product.category_id,
    status: product.status === "active" ? "active" : "draft",
    seoTitle: product.seo_title ?? "",
    seoDescription: product.seo_description ?? "",
    basePrice: product.base_price,
    compareAtPrice: product.compare_at_price,
    featured: product.featured,
    tags: product.tags,
    collectionIds: product.collectionIds,
  };
}

export function ProductForm({
  product,
  categories,
  collections,
}: {
  product: ProductDetail | null;
  categories: Option[];
  collections: Option[];
}) {
  const router = useRouter();
  const isEdit = product !== null;
  const [slugDirty, setSlugDirty] = useState(isEdit);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toDefaults(product),
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = isEdit
      ? await updateProductAction(product.id, values)
      : await createProductAction(values);

    if (!result.ok) {
      applyServerErrors(result.error, setError);
      toast.error(result.error.message);
      return;
    }

    if (isEdit) {
      toast.success("Product saved");
      router.refresh();
    } else {
      toast.success("Product created");
      router.push(`/admin/catalog/products/${result.data.id}`);
    }
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow
              label="Title"
              htmlFor="p-title"
              required
              error={errors.title?.message}
            >
              <Input
                id="p-title"
                {...register("title", {
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
              htmlFor="p-slug"
              required
              error={errors.slug?.message}
            >
              <Input
                id="p-slug"
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
              htmlFor="p-description"
              error={errors.description?.message}
            >
              <Textarea
                id="p-description"
                rows={5}
                {...register("description")}
              />
            </FormRow>

            <FormRow
              label="Brand"
              htmlFor="p-brand"
              error={errors.brand?.message}
            >
              <Input id="p-brand" {...register("brand")} />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Price" required error={errors.basePrice?.message}>
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => (
                  <PriceInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormRow>
            <FormRow
              label="Compare at price"
              hint="Original price shown with a strike-through."
              error={errors.compareAtPrice?.message}
            >
              <Controller
                control={control}
                name="compareAtPrice"
                render={({ field }) => (
                  <PriceInput
                    value={field.value}
                    onChange={field.onChange}
                    allowNull
                  />
                )}
              />
            </FormRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search engine listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow
              label="SEO title"
              htmlFor="p-seo-title"
              error={errors.seoTitle?.message}
            >
              <Input id="p-seo-title" {...register("seoTitle")} />
            </FormRow>
            <FormRow
              label="SEO description"
              htmlFor="p-seo-description"
              error={errors.seoDescription?.message}
            >
              <Textarea
                id="p-seo-description"
                rows={3}
                {...register("seoDescription")}
              />
            </FormRow>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow
              label="Status"
              htmlFor="p-status"
              error={errors.status?.message}
            >
              <select
                id="p-status"
                className={selectClass}
                {...register("status")}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </FormRow>

            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Featured</span>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow label="Category" htmlFor="p-category">
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <select
                    id="p-category"
                    className={selectClass}
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(event.target.value || null)
                    }
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </FormRow>

            <FormRow label="Collections">
              <Controller
                control={control}
                name="collectionIds"
                render={({ field }) =>
                  collections.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No collections yet.
                    </p>
                  ) : (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto">
                      {collections.map((collection) => {
                        const checked = field.value.includes(collection.id);
                        return (
                          <label
                            key={collection.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              className="accent-primary size-4"
                              checked={checked}
                              onChange={(event) =>
                                field.onChange(
                                  event.target.checked
                                    ? [...field.value, collection.id]
                                    : field.value.filter(
                                        (id) => id !== collection.id,
                                      ),
                                )
                              }
                            />
                            {collection.name}
                          </label>
                        );
                      })}
                    </div>
                  )
                }
              />
            </FormRow>

            <FormRow label="Tags" error={errors.tags?.message}>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagsInput value={field.value} onChange={field.onChange} />
                )}
              />
            </FormRow>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : isEdit
              ? "Save product"
              : "Create product"}
        </Button>
      </div>
    </form>
  );
}
