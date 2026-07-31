"use server";

import { revalidatePath } from "next/cache";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";

import {
  bulkBrandSchema,
  bulkCategorySchema,
  bulkCollectionSchema,
  bulkIdsSchema,
  bulkInventorySchema,
  bulkPriceSchema,
  bulkStatusSchema,
  bulkTagsSchema,
} from "./bulk-schema";
import * as bulk from "./bulk-service";
import { getBulkProductSummaries } from "./queries";
import { type BulkProductSummary } from "./types";

const LIST_PATH = "/admin/catalog/products";

function revalidate() {
  revalidatePath(LIST_PATH);
}

export async function bulkStatusAction(
  ids: unknown,
  status: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const value = bulkStatusSchema.parse(status);
    const count = await bulk.bulkSetStatus(productIds, value);
    revalidate();
    return count;
  });
}

export async function bulkDeleteAction(ids: unknown): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const count = await bulk.bulkDelete(productIds);
    revalidate();
    return count;
  });
}

export async function bulkCategoryAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { categoryId } = bulkCategorySchema.parse(input);
    const count = await bulk.bulkSetCategory(productIds, categoryId);
    revalidate();
    return count;
  });
}

export async function bulkCollectionAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { collectionId } = bulkCollectionSchema.parse(input);
    const count = await bulk.bulkAddToCollection(productIds, collectionId);
    revalidate();
    return count;
  });
}

export async function bulkBrandAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { brand } = bulkBrandSchema.parse(input);
    const count = await bulk.bulkSetBrand(productIds, brand);
    revalidate();
    return count;
  });
}

export async function bulkTagsAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { tags, add } = bulkTagsSchema.parse(input);
    const count = await bulk.bulkEditTags(productIds, tags, add);
    revalidate();
    return count;
  });
}

export async function bulkPriceAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { mode, value } = bulkPriceSchema.parse(input);
    const count = await bulk.bulkUpdatePrices(productIds, mode, value);
    revalidate();
    return count;
  });
}

export async function bulkInventoryAction(
  ids: unknown,
  input: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const { mode, value } = bulkInventorySchema.parse(input);
    const count = await bulk.bulkAdjustInventory(productIds, mode, value);
    revalidate();
    return count;
  });
}

export async function bulkDuplicateAction(
  ids: unknown,
): Promise<Result<number>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    const count = await bulk.bulkDuplicate(productIds);
    revalidate();
    return count;
  });
}

export async function bulkPreviewAction(
  ids: unknown,
): Promise<Result<BulkProductSummary[]>> {
  return runStaffAction(async () => {
    const productIds = bulkIdsSchema.parse(ids);
    return getBulkProductSummaries(productIds);
  });
}
