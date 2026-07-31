"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { ExportButton } from "@/components/admin/export-button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { archiveCouponAction, restoreCouponAction } from "../actions";
import {
  type Coupon,
  type CouponListItem,
  type CouponListResult,
  type CouponSort,
  type CouponStatus,
} from "../types";
import { CouponStatusBadge } from "./coupon-badges";
import { CouponFormDialog } from "./coupon-form-dialog";

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 rounded-lg border px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "code:asc", label: "Code A–Z" },
  { value: "usage:desc", label: "Most used" },
];

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function discountLabel(coupon: Coupon): string {
  return coupon.type === "percentage"
    ? `${coupon.value}%`
    : formatPaise(coupon.value);
}

function windowLabel(coupon: Coupon): string {
  const start = coupon.starts_at
    ? dateFmt.format(new Date(coupon.starts_at))
    : null;
  const end = coupon.ends_at ? dateFmt.format(new Date(coupon.ends_at)) : null;
  if (!start && !end) return "No expiry";
  return `${start ?? "—"} → ${end ?? "—"}`;
}

function RowActions({
  coupon,
  onEdit,
  onArchiveToggle,
}: {
  coupon: CouponListItem;
  onEdit: (coupon: Coupon) => void;
  onArchiveToggle: (coupon: CouponListItem, archive: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Coupon actions" />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => onEdit(coupon)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {coupon.status === "archived" ? (
          <DropdownMenuItem onClick={() => onArchiveToggle(coupon, false)}>
            <ArchiveRestore /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onArchiveToggle(coupon, true)}
          >
            <Archive /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CouponsManager({
  result,
  search,
}: {
  result: CouponListResult;
  search: string;
}) {
  const router = useRouter();
  const { filters } = result;
  const [term, setTerm] = useState(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [confirm, setConfirm] = useState<{
    coupon: CouponListItem;
    archive: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtersActive = Boolean(search || filters.status);
  const animationKey = `${result.page}:${result.sort}:${result.dir}:${search}:${filters.status}`;

  function navigate(next: {
    page?: number;
    q?: string;
    status?: CouponStatus | null;
    sort?: CouponSort;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    if (q) params.set("q", q);

    const status = next.status !== undefined ? next.status : filters.status;
    if (status) params.set("status", status);

    const sort = next.sort ?? result.sort;
    const dir = next.dir ?? result.dir;
    if (sort !== "created" || dir !== "desc") {
      params.set("sort", sort);
      params.set("dir", dir);
    }

    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.push(`/admin/coupons${qs ? `?${qs}` : ""}`);
  }

  function clearFilters() {
    setTerm("");
    navigate({ q: "", status: null, page: 1 });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(coupon: Coupon) {
    setEditing(coupon);
    setFormOpen(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    setWorking(true);
    const { coupon, archive } = confirm;
    const res = archive
      ? await archiveCouponAction(coupon.id)
      : await restoreCouponAction(coupon.id);
    setWorking(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(archive ? "Coupon archived" : "Coupon restored");
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ q: term, page: 1 });
            }}
            className="relative min-w-[200px] flex-1 sm:max-w-xs"
          >
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search coupons…"
              className="h-9 rounded-lg pl-9"
            />
          </form>

          <select
            aria-label="Filter by status"
            className={selectClass}
            value={filters.status ?? ""}
            onChange={(event) =>
              navigate({
                status: (event.target.value || null) as CouponStatus | null,
                page: 1,
              })
            }
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>

          <select
            aria-label="Sort coupons"
            className={selectClass}
            value={`${result.sort}:${result.dir}`}
            onChange={(event) => {
              const [sort, dir] = event.target.value.split(":") as [
                CouponSort,
                "asc" | "desc",
              ];
              navigate({ sort, dir, page: 1 });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {filtersActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X /> Clear
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <ExportButton entity="coupons" />
          <Button
            onClick={openCreate}
            className="h-9 rounded-full px-4 shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5"
          >
            <Plus /> New Coupon
          </Button>
        </div>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={filtersActive ? "No coupons found" : "No coupons yet"}
          description={
            filtersActive
              ? "Try adjusting your search or filters."
              : "Create your first discount code to run a promotion."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={openCreate}>
                <Plus /> Create Coupon
              </Button>
            )
          }
        />
      ) : (
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-4"
        >
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border lg:block">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="border-border border-b">
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Code
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Discount
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Min order
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    Usage
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Window
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Status
                  </th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-border/70 group border-b transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="font-mono text-sm font-medium">
                        {coupon.code}
                      </div>
                      {coupon.description ? (
                        <div className="text-muted-foreground truncate text-xs">
                          {coupon.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium">
                        {discountLabel(coupon)}
                      </span>
                      {coupon.type === "percentage" && coupon.max_discount ? (
                        <span className="text-muted-foreground text-xs">
                          {" "}
                          up to {formatPaise(coupon.max_discount)}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground px-5 py-4">
                      {coupon.min_order > 0
                        ? formatPaise(coupon.min_order)
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {coupon.times_used}
                      {coupon.usage_limit != null ? (
                        <span className="text-muted-foreground">
                          {" "}
                          / {coupon.usage_limit}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground px-5 py-4 text-xs whitespace-nowrap">
                      {windowLabel(coupon)}
                    </td>
                    <td className="px-5 py-4">
                      <CouponStatusBadge status={coupon.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RowActions
                        coupon={coupon}
                        onEdit={openEdit}
                        onArchiveToggle={(c, archive) =>
                          setConfirm({ coupon: c, archive })
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {result.items.map((coupon) => (
              <div
                key={coupon.id}
                className="bg-card rounded-2xl border p-4 transition-colors hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium">
                      {coupon.code}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {discountLabel(coupon)} off · {windowLabel(coupon)}
                    </div>
                  </div>
                  <RowActions
                    coupon={coupon}
                    onEdit={openEdit}
                    onArchiveToggle={(c, archive) =>
                      setConfirm({ coupon: c, archive })
                    }
                  />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <CouponStatusBadge status={coupon.status} />
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {coupon.times_used}
                    {coupon.usage_limit != null
                      ? ` / ${coupon.usage_limit}`
                      : ""}{" "}
                    used
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-muted-foreground text-sm">
              Page {result.page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={result.page <= 1}
                onClick={() => navigate({ page: result.page - 1 })}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={result.page >= totalPages}
                onClick={() => navigate({ page: result.page + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <CouponFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirm?.archive ? "Archive coupon?" : "Restore coupon?"}
        description={
          confirm?.archive
            ? "It will stop working immediately but stays on record."
            : "It will be usable again, subject to its dates and limits."
        }
        confirmLabel={confirm?.archive ? "Archive" : "Restore"}
        destructive={confirm?.archive ?? false}
        loading={working}
        onConfirm={runConfirm}
      />
    </div>
  );
}
