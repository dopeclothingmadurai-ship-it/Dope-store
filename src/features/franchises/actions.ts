"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { franchiseFormSchema } from "./schema";
import * as service from "./service";
import { type Franchise } from "./types";

const ADMIN_PATH = "/admin/franchise";

export async function createFranchiseAction(
  input: unknown,
): Promise<Result<Franchise>> {
  return runStaffAction(async () => {
    const values = franchiseFormSchema.parse(input);
    const franchise = await service.createFranchise(values);
    revalidatePath(ADMIN_PATH);
    return franchise;
  });
}

export async function updateFranchiseAction(
  id: unknown,
  input: unknown,
): Promise<Result<Franchise>> {
  return runStaffAction(async () => {
    const franchiseId = uuidSchema.parse(id);
    const values = franchiseFormSchema.parse(input);
    const franchise = await service.updateFranchise(franchiseId, values);
    revalidatePath(ADMIN_PATH);
    return franchise;
  });
}

export async function setFranchiseStatusAction(
  id: unknown,
  status: unknown,
): Promise<Result<Franchise>> {
  return runStaffAction(async () => {
    const franchiseId = uuidSchema.parse(id);
    const nextStatus = z.enum(["active", "inactive"]).parse(status);
    const franchise = await service.setFranchiseStatus(
      franchiseId,
      nextStatus,
    );
    revalidatePath(ADMIN_PATH);
    return franchise;
  });
}

export async function deleteFranchiseAction(
  id: unknown,
): Promise<Result<null>> {
  return runStaffAction(async () => {
    await service.deleteFranchise(uuidSchema.parse(id));
    revalidatePath(ADMIN_PATH);
    return null;
  });
}
