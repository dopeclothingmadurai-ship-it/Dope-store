import "server-only";

import { AppError, ConflictError, fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { type TablesUpdate } from "@/types/database";

import {
  type PaymentsValues,
  type StoreProfileValues,
  type TaxShippingValues,
} from "./schema";
import { type StaffRole, type StoreSettings } from "./types";

async function updateSettings(
  patch: TablesUpdate<"store_settings">,
): Promise<StoreSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("store_settings")
    .update(patch)
    .eq("id", true)
    .select("*")
    .single();
  if (error) throw fromPostgrestError(error);
  return data;
}

export async function updateStoreProfile(
  input: StoreProfileValues,
): Promise<StoreSettings> {
  const address = input.address;
  const hasAddress = Object.values(address).some((value) => value);
  return updateSettings({
    store_name: input.storeName,
    support_email: input.supportEmail,
    support_phone: input.supportPhone,
    gst_number: input.gstNumber,
    address: hasAddress ? address : null,
    currency: input.currency,
    timezone: input.timezone,
    logo_url: input.logoUrl,
  });
}

export async function updateTaxShipping(
  input: TaxShippingValues,
): Promise<StoreSettings> {
  return updateSettings({
    tax_rate_bps: input.taxRateBps,
    shipping_flat: input.shippingFlat,
    free_shipping_threshold: input.freeShippingThreshold,
  });
}

export async function updatePayments(
  input: PaymentsValues,
): Promise<StoreSettings> {
  return updateSettings({ razorpay_key_id: input.razorpayKeyId });
}

export async function updateMaintenance(
  maintenanceMode: boolean,
): Promise<StoreSettings> {
  return updateSettings({ maintenance_mode: maintenanceMode });
}

export async function updateStaffRole(
  callerId: string,
  targetId: string,
  role: StaffRole,
): Promise<void> {
  const db = createAdminClient();

  const { data: caller, error: callerError } = await db
    .from("staff_profiles")
    .select("role")
    .eq("id", callerId)
    .maybeSingle();
  if (callerError) throw fromPostgrestError(callerError);
  if (caller?.role !== "owner") {
    throw new AppError("forbidden", "Only owners can change staff roles.");
  }

  const { data: target, error: targetError } = await db
    .from("staff_profiles")
    .select("role")
    .eq("id", targetId)
    .maybeSingle();
  if (targetError) throw fromPostgrestError(targetError);
  if (!target) throw new AppError("not_found", "That staff member is gone.");

  // Never leave the store without an owner.
  if (target.role === "owner" && role !== "owner") {
    const { count, error: countError } = await db
      .from("staff_profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner");
    if (countError) throw fromPostgrestError(countError);
    if ((count ?? 0) <= 1) {
      throw new ConflictError("You can't remove the last owner.");
    }
  }

  const { error } = await db
    .from("staff_profiles")
    .update({ role })
    .eq("id", targetId);
  if (error) throw fromPostgrestError(error);
}

/** A bounded JSON snapshot of the store's key records. */
export async function exportStoreData(): Promise<Record<string, unknown>> {
  const db = createAdminClient();

  const [
    settings,
    products,
    categories,
    collections,
    coupons,
    customers,
    orders,
  ] = await Promise.all([
    db.from("store_settings").select("*").eq("id", true).single(),
    db
      .from("products")
      .select("id, title, slug, status, base_price, created_at"),
    db.from("categories").select("id, name, slug, archived_at"),
    db.from("collections").select("id, name, slug, archived_at"),
    db.from("coupons").select("id, code, type, value, times_used, archived_at"),
    db.from("customers").select("id, email, name, phone, created_at"),
    db
      .from("orders")
      .select(
        "id, order_number, status, payment_status, grand_total, placed_at",
      ),
  ]);

  for (const result of [
    settings,
    products,
    categories,
    collections,
    coupons,
    customers,
    orders,
  ]) {
    if (result.error) throw fromPostgrestError(result.error);
  }

  return {
    exportedAt: new Date().toISOString(),
    store: settings.data,
    products: products.data,
    categories: categories.data,
    collections: collections.data,
    coupons: coupons.data,
    customers: customers.data,
    orders: orders.data,
  };
}

/** Archive every currently-active product (reversible — nothing is deleted). */
export async function archiveActiveProducts(): Promise<number> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("status", "active")
    .select("id");
  if (error) throw fromPostgrestError(error);
  return data.length;
}
