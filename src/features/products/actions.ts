"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import {
  inventoryAdjustSchema,
  productFormSchema,
  productMediaSchema,
  variantFormSchema,
} from "./schema";
import * as service from "./service";
import {
  type Inventory,
  type Product,
  type ProductMedia,
  type ProductVariant,
} from "./types";

const LIST_PATH = "/admin/catalog/products";

function revalidateProduct(productId?: string) {
  revalidatePath(LIST_PATH);
  if (productId) revalidatePath(`${LIST_PATH}/${productId}`);
}

/* --- Product ------------------------------------------------------------- */

export async function createProductAction(
  input: unknown,
): Promise<Result<Product>> {
  return runAction(async () => {
    const values = productFormSchema.parse(input);
    const product = await service.createProduct(values);
    revalidateProduct(product.id);
    return product;
  });
}

export async function updateProductAction(
  id: unknown,
  input: unknown,
): Promise<Result<Product>> {
  return runAction(async () => {
    const productId = uuidSchema.parse(id);
    const values = productFormSchema.parse(input);
    const product = await service.updateProduct(productId, values);
    revalidateProduct(productId);
    return product;
  });
}

export async function archiveProductAction(
  id: unknown,
): Promise<Result<Product>> {
  return runAction(async () => {
    const product = await service.archiveProduct(uuidSchema.parse(id));
    revalidateProduct(product.id);
    return product;
  });
}

export async function restoreProductAction(
  id: unknown,
): Promise<Result<Product>> {
  return runAction(async () => {
    const product = await service.restoreProduct(uuidSchema.parse(id));
    revalidateProduct(product.id);
    return product;
  });
}

/* --- Variants ------------------------------------------------------------ */

export async function createVariantAction(
  productId: unknown,
  input: unknown,
): Promise<Result<ProductVariant>> {
  return runAction(async () => {
    const id = uuidSchema.parse(productId);
    const values = variantFormSchema.parse(input);
    const variant = await service.createVariant(id, values);
    revalidateProduct(id);
    return variant;
  });
}

export async function updateVariantAction(
  productId: unknown,
  variantId: unknown,
  input: unknown,
): Promise<Result<ProductVariant>> {
  return runAction(async () => {
    const pid = uuidSchema.parse(productId);
    const vid = uuidSchema.parse(variantId);
    const values = variantFormSchema.parse(input);
    const variant = await service.updateVariant(vid, values);
    revalidateProduct(pid);
    return variant;
  });
}

export async function deleteVariantAction(
  productId: unknown,
  variantId: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const pid = uuidSchema.parse(productId);
    await service.deleteVariant(uuidSchema.parse(variantId));
    revalidateProduct(pid);
    return null;
  });
}

/* --- Inventory ----------------------------------------------------------- */

export async function adjustInventoryAction(
  productId: unknown,
  variantId: unknown,
  input: unknown,
): Promise<Result<Inventory>> {
  return runAction(async () => {
    const pid = uuidSchema.parse(productId);
    const vid = uuidSchema.parse(variantId);
    const values = inventoryAdjustSchema.parse(input);
    const inventory = await service.adjustInventory(vid, values);
    revalidateProduct(pid);
    return inventory;
  });
}

/* --- Media --------------------------------------------------------------- */

export async function addProductMediaAction(
  productId: unknown,
  input: unknown,
): Promise<Result<ProductMedia>> {
  return runAction(async () => {
    const id = uuidSchema.parse(productId);
    const values = productMediaSchema.parse(input);
    const media = await service.addProductMedia(id, values);
    revalidateProduct(id);
    return media;
  });
}

export async function reorderProductMediaAction(
  productId: unknown,
  orderedIds: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const id = uuidSchema.parse(productId);
    const ids = z.array(uuidSchema).parse(orderedIds);
    await service.reorderProductMedia(id, ids);
    revalidateProduct(id);
    return null;
  });
}

export async function setPrimaryProductMediaAction(
  productId: unknown,
  mediaId: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const id = uuidSchema.parse(productId);
    await service.setPrimaryProductMedia(id, uuidSchema.parse(mediaId));
    revalidateProduct(id);
    return null;
  });
}

export async function deleteProductMediaAction(
  productId: unknown,
  mediaId: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const id = uuidSchema.parse(productId);
    await service.deleteProductMedia(uuidSchema.parse(mediaId));
    revalidateProduct(id);
    return null;
  });
}
