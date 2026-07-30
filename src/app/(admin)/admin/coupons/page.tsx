import { CouponsManager } from "@/features/coupons/components/coupons-manager";
import { listCoupons } from "@/features/coupons/queries";
import { type CouponSort, type CouponStatus } from "@/features/coupons/types";

export const dynamic = "force-dynamic";

const SORTS: CouponSort[] = ["created", "code", "usage"];
const STATUSES: CouponStatus[] = [
  "active",
  "scheduled",
  "expired",
  "archived",
];

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    dir?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const parsedPage = Number(params.page);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const sort: CouponSort = SORTS.includes(params.sort as CouponSort)
    ? (params.sort as CouponSort)
    : "created";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";
  const status: CouponStatus | null = STATUSES.includes(
    params.status as CouponStatus,
  )
    ? (params.status as CouponStatus)
    : null;

  const result = await listCoupons({ page, search, sort, dir, status });

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Coupons
        </h1>
        <p className="text-muted-foreground text-sm">
          Create and manage discount codes for checkout and point of sale.
        </p>
      </div>

      <CouponsManager result={result} search={search} />
    </div>
  );
}
