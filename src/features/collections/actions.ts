"use server";

import { revalidatePath } from "next/cache";

import { runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { collectionFormSchema, collectionProductsSchema } from "./schema";
import * as service from "./service";
import { type Collection } from "./types";

const LIST_PATH = "/admin/catalog/collections";

function revalidateCollection(id?: string) {
  revalidatePath(LIST_PATH);
  if (id) revalidatePath(`${LIST_PATH}/${id}`);
}

export async function createCollectionAction(
  input: unknown,
): Promise<Result<Collection>> {
  return runAction(async () => {
    const values = collectionFormSchema.parse(input);
    const collection = await service.createCollection(values);
    revalidateCollection(collection.id);
    return collection;
  });
}

export async function updateCollectionAction(
  id: unknown,
  input: unknown,
): Promise<Result<Collection>> {
  return runAction(async () => {
    const collectionId = uuidSchema.parse(id);
    const values = collectionFormSchema.parse(input);
    const collection = await service.updateCollection(collectionId, values);
    revalidateCollection(collectionId);
    return collection;
  });
}

export async function archiveCollectionAction(
  id: unknown,
): Promise<Result<Collection>> {
  return runAction(async () => {
    const collection = await service.archiveCollection(uuidSchema.parse(id));
    revalidateCollection(collection.id);
    return collection;
  });
}

export async function restoreCollectionAction(
  id: unknown,
): Promise<Result<Collection>> {
  return runAction(async () => {
    const collection = await service.restoreCollection(uuidSchema.parse(id));
    revalidateCollection(collection.id);
    return collection;
  });
}

export async function setCollectionProductsAction(
  id: unknown,
  input: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const collectionId = uuidSchema.parse(id);
    const { productIds } = collectionProductsSchema.parse(input);
    await service.setCollectionProducts(collectionId, productIds);
    revalidateCollection(collectionId);
    return null;
  });
}
