import { type Enums, type Tables } from "@/types/database";

export type Coupon = Tables<"coupons">;
export type CouponType = Enums<"coupon_type">;

/** Derived lifecycle state (never stored — computed from dates + archive). */
export type CouponStatus = "active" | "scheduled" | "expired" | "archived";

export type CouponSort = "created" | "code" | "usage";

export type CouponListItem = Coupon & { status: CouponStatus };

export type CouponFilters = {
  status: CouponStatus | null;
};

export type CouponListResult = {
  items: CouponListItem[];
  total: number;
  page: number;
  pageSize: number;
  sort: CouponSort;
  dir: "asc" | "desc";
  filters: CouponFilters;
};

/** Successful validation of a code against a cart subtotal. */
export type CouponValidation = {
  couponId: string;
  code: string;
  type: CouponType;
  discount: number; // paise
};

export function couponStatus(coupon: Coupon): CouponStatus {
  if (coupon.archived_at) return "archived";
  const now = Date.now();
  if (coupon.starts_at && now < new Date(coupon.starts_at).getTime()) {
    return "scheduled";
  }
  if (coupon.ends_at && now > new Date(coupon.ends_at).getTime()) {
    return "expired";
  }
  return "active";
}

export type { CouponFormValues } from "./schema";
