import "server-only";

import {
  ConflictError,
  ValidationError,
  fromPostgrestError,
} from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import { type CouponFormValues } from "./schema";
import { type Coupon, type CouponValidation, couponStatus } from "./types";

type Db = ReturnType<typeof createAdminClient>;

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function toRow(input: CouponFormValues) {
  return {
    code: normalizeCode(input.code),
    description: input.description?.trim() ? input.description.trim() : null,
    type: input.type,
    value: input.value,
    min_order: input.minOrder,
    max_discount: input.maxDiscount,
    usage_limit: input.usageLimit,
    per_customer_limit: input.perCustomerLimit,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
  };
}

/** Reject a duplicate code (case-insensitive), excluding an optional id. */
async function assertCodeAvailable(
  db: Db,
  code: string,
  excludeId?: string,
): Promise<void> {
  let query = db.from("coupons").select("id").ilike("code", code);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== "PGRST116") throw fromPostgrestError(error);
  if (data) {
    throw new ConflictError("That coupon code is already in use.");
  }
}

export async function createCoupon(input: CouponFormValues): Promise<Coupon> {
  const db = createAdminClient();
  const row = toRow(input);
  await assertCodeAvailable(db, row.code);

  const { data, error } = await db
    .from("coupons")
    .insert(row)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateCoupon(
  id: string,
  input: CouponFormValues,
): Promise<Coupon> {
  const db = createAdminClient();
  const row = toRow(input);
  await assertCodeAvailable(db, row.code, id);

  const { data, error } = await db
    .from("coupons")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function archiveCoupon(id: string): Promise<Coupon> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("coupons")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function restoreCoupon(id: string): Promise<Coupon> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("coupons")
    .update({ archived_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

/** Compute the discount a coupon grants on a subtotal (paise). */
function computeDiscount(coupon: Coupon, subtotal: number): number {
  const raw =
    coupon.type === "percentage"
      ? Math.floor((subtotal * coupon.value) / 100)
      : coupon.value;
  const capped =
    coupon.max_discount != null ? Math.min(raw, coupon.max_discount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

/**
 * Validate a code against a cart subtotal. Server-side source of truth used by
 * POS (preview + at checkout). Throws a ValidationError with a friendly message
 * when the code cannot be applied.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  customerEmail?: string | null,
): Promise<CouponValidation> {
  const db = createAdminClient();
  const normalized = normalizeCode(code);

  const { data: coupon, error } = await db
    .from("coupons")
    .select("*")
    .ilike("code", normalized)
    .is("archived_at", null)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw fromPostgrestError(error);
  if (!coupon) throw new ValidationError("That coupon code is not valid.");

  const status = couponStatus(coupon);
  if (status === "scheduled") {
    throw new ValidationError("This coupon is not active yet.");
  }
  if (status === "expired") {
    throw new ValidationError("This coupon has expired.");
  }
  if (subtotal < coupon.min_order) {
    throw new ValidationError(
      `Add more to reach the minimum order for this coupon.`,
    );
  }
  if (coupon.usage_limit != null && coupon.times_used >= coupon.usage_limit) {
    throw new ValidationError("This coupon has reached its usage limit.");
  }

  if (coupon.per_customer_limit != null && customerEmail?.trim()) {
    const email = customerEmail.trim().toLowerCase();
    const { count, error: countError } = await db
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .ilike("customer_email", email);
    if (countError) throw fromPostgrestError(countError);
    if ((count ?? 0) >= coupon.per_customer_limit) {
      throw new ValidationError(
        "This customer has already used this coupon the maximum number of times.",
      );
    }
  }

  const discount = computeDiscount(coupon, subtotal);
  if (discount <= 0) {
    throw new ValidationError("This coupon does not apply to this order.");
  }

  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discount,
  };
}
