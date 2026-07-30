"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runStaffAction } from "@/lib/auth/guard";
import { type Result } from "@/lib/result";
import { uuidSchema } from "@/lib/validation/common";

import { couponFormSchema } from "./schema";
import * as service from "./service";
import { type Coupon, type CouponValidation } from "./types";

const LIST_PATH = "/admin/coupons";

export async function createCouponAction(
  input: unknown,
): Promise<Result<Coupon>> {
  return runStaffAction(async () => {
    const values = couponFormSchema.parse(input);
    const coupon = await service.createCoupon(values);
    revalidatePath(LIST_PATH);
    return coupon;
  });
}

export async function updateCouponAction(
  id: unknown,
  input: unknown,
): Promise<Result<Coupon>> {
  return runStaffAction(async () => {
    const couponId = uuidSchema.parse(id);
    const values = couponFormSchema.parse(input);
    const coupon = await service.updateCoupon(couponId, values);
    revalidatePath(LIST_PATH);
    return coupon;
  });
}

export async function archiveCouponAction(
  id: unknown,
): Promise<Result<Coupon>> {
  return runStaffAction(async () => {
    const coupon = await service.archiveCoupon(uuidSchema.parse(id));
    revalidatePath(LIST_PATH);
    return coupon;
  });
}

export async function restoreCouponAction(
  id: unknown,
): Promise<Result<Coupon>> {
  return runStaffAction(async () => {
    const coupon = await service.restoreCoupon(uuidSchema.parse(id));
    revalidatePath(LIST_PATH);
    return coupon;
  });
}

const validateInputSchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.coerce.number().int().min(0),
  customerEmail: z.string().trim().nullable().optional(),
});

/** Preview a coupon against a subtotal (used by the POS terminal). */
export async function validateCouponAction(
  input: unknown,
): Promise<Result<CouponValidation>> {
  return runStaffAction(async () => {
    const { code, subtotal, customerEmail } = validateInputSchema.parse(input);
    return service.validateCoupon(code, subtotal, customerEmail ?? null);
  });
}
