"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { categoryFormSchema } from "./schema";
import * as service from "./service";
import { type Category } from "./types";

const CATALOG_PATH = "/admin/catalog/categories";

export async function createCategoryAction(
  input: unknown,
): Promise<Result<Category>> {
  return runAction(async () => {
    const values = categoryFormSchema.parse(input);
    const category = await service.createCategory(values);
    revalidatePath(CATALOG_PATH);
    return category;
  });
}

export async function updateCategoryAction(
  id: unknown,
  input: unknown,
): Promise<Result<Category>> {
  return runAction(async () => {
    const categoryId = uuidSchema.parse(id);
    const values = categoryFormSchema.parse(input);
    const category = await service.updateCategory(categoryId, values);
    revalidatePath(CATALOG_PATH);
    return category;
  });
}

export async function archiveCategoryAction(
  id: unknown,
): Promise<Result<Category>> {
  return runAction(async () => {
    const category = await service.archiveCategory(uuidSchema.parse(id));
    revalidatePath(CATALOG_PATH);
    return category;
  });
}

export async function restoreCategoryAction(
  id: unknown,
): Promise<Result<Category>> {
  return runAction(async () => {
    const category = await service.restoreCategory(uuidSchema.parse(id));
    revalidatePath(CATALOG_PATH);
    return category;
  });
}

export async function reorderCategoriesAction(
  orderedIds: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const ids = z.array(uuidSchema).parse(orderedIds);
    await service.reorderCategories(ids);
    revalidatePath(CATALOG_PATH);
    return null;
  });
}
