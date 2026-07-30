"use server";

import { revalidatePath } from "next/cache";

import { getAuthUser } from "@/lib/auth/staff";
import { runStaffAction } from "@/lib/auth/guard";
import { AppError } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import {
  maintenanceSchema,
  paymentsSchema,
  staffRoleSchema,
  storeProfileSchema,
  taxShippingSchema,
} from "./schema";
import * as service from "./service";
import { type StoreSettings } from "./types";

const SETTINGS_PATH = "/admin/settings";

export async function updateStoreProfileAction(
  input: unknown,
): Promise<Result<StoreSettings>> {
  return runStaffAction(async () => {
    const values = storeProfileSchema.parse(input);
    const settings = await service.updateStoreProfile(values);
    revalidatePath(SETTINGS_PATH);
    return settings;
  });
}

export async function updateTaxShippingAction(
  input: unknown,
): Promise<Result<StoreSettings>> {
  return runStaffAction(async () => {
    const values = taxShippingSchema.parse(input);
    const settings = await service.updateTaxShipping(values);
    revalidatePath(SETTINGS_PATH);
    return settings;
  });
}

export async function updatePaymentsAction(
  input: unknown,
): Promise<Result<StoreSettings>> {
  return runStaffAction(async () => {
    const values = paymentsSchema.parse(input);
    const settings = await service.updatePayments(values);
    revalidatePath(SETTINGS_PATH);
    return settings;
  });
}

export async function updateMaintenanceAction(
  input: unknown,
): Promise<Result<StoreSettings>> {
  return runStaffAction(async () => {
    const { maintenanceMode } = maintenanceSchema.parse(input);
    const settings = await service.updateMaintenance(maintenanceMode);
    revalidatePath(SETTINGS_PATH);
    return settings;
  });
}

export async function updateStaffRoleAction(
  targetId: unknown,
  role: unknown,
): Promise<Result<null>> {
  return runStaffAction(async () => {
    const user = await getAuthUser();
    if (!user) throw new AppError("unauthorized", "You must be signed in.");
    const id = uuidSchema.parse(targetId);
    const nextRole = staffRoleSchema.parse(role);
    await service.updateStaffRole(user.id, id, nextRole);
    revalidatePath(SETTINGS_PATH);
    return null;
  });
}

export async function exportStoreDataAction(): Promise<Result<string>> {
  return runStaffAction(async () => {
    const data = await service.exportStoreData();
    return JSON.stringify(data, null, 2);
  });
}

export async function archiveStoreDataAction(): Promise<Result<number>> {
  return runStaffAction(async () => {
    const count = await service.archiveActiveProducts();
    revalidatePath("/admin/catalog/products");
    revalidatePath(SETTINGS_PATH);
    return count;
  });
}
