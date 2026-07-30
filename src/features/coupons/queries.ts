import "server-only";

import { fromPostgrestError } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  type CouponListResult,
  type CouponSort,
  type CouponStatus,
  couponStatus,
} from "./types";

export const COUPONS_PAGE_SIZE = 20;

const SORT_COLUMNS: Record<CouponSort, "created_at" | "code" | "times_used"> = {
  created: "created_at",
  code: "code",
  usage: "times_used",
};

/** Paginated, searchable, sortable coupon list with derived lifecycle status. */
export async function listCoupons(params: {
  page?: number;
  search?: string;
  status?: CouponStatus | null;
  sort?: CouponSort;
  dir?: "asc" | "desc";
}): Promise<CouponListResult> {
  const db = createAdminClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = COUPONS_PAGE_SIZE;
  const sort: CouponSort = params.sort ?? "created";
  const ascending = params.dir === "asc";
  const status = params.status ?? null;

  let query = db.from("coupons").select("*");
  const search = params.search?.trim();
  if (search) {
    const escaped = search.replace(/[%,]/g, "");
    query = query.or(`code.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }
  // Archived is a stored flag; the other states are date-derived and filtered
  // in memory after fetching.
  if (status === "archived") query = query.not("archived_at", "is", null);
  else if (status) query = query.is("archived_at", null);

  const { data, error } = await query.order(SORT_COLUMNS[sort], {
    ascending,
  });
  if (error) throw fromPostgrestError(error);

  let items = data.map((coupon) => ({
    ...coupon,
    status: couponStatus(coupon),
  }));
  if (status && status !== "archived") {
    items = items.filter((coupon) => coupon.status === status);
  }

  const total = items.length;
  const from = (page - 1) * pageSize;
  const paged = items.slice(from, from + pageSize);

  return {
    items: paged,
    total,
    page,
    pageSize,
    sort,
    dir: ascending ? "asc" : "desc",
    filters: { status },
  };
}

export async function getCoupon(id: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw fromPostgrestError(error);
  return data;
}
