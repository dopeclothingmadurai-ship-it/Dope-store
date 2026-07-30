"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Users, X } from "lucide-react";

import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { type CustomerListResult, type CustomerSort } from "../types";

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 rounded-lg border px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
];

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function Avatar({ name, email }: { name: string | null; email: string }) {
  const initial = ((name?.trim() || email).charAt(0) || "?").toUpperCase();
  return (
    <span className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-1 ring-white/10">
      {initial}
    </span>
  );
}

export function CustomersManager({
  result,
  search,
}: {
  result: CustomerListResult;
  search: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(search);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtersActive = Boolean(search);
  const animationKey = `${result.page}:${result.sort}:${result.dir}:${search}`;

  function navigate(next: {
    page?: number;
    q?: string;
    sort?: CustomerSort;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    if (q) params.set("q", q);

    const sort = next.sort ?? result.sort;
    const dir = next.dir ?? result.dir;
    if (sort !== "created" || dir !== "desc") {
      params.set("sort", sort);
      params.set("dir", dir);
    }

    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.push(`/admin/customers${qs ? `?${qs}` : ""}`);
  }

  function clearFilters() {
    setTerm("");
    navigate({ q: "", page: 1 });
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
              placeholder="Search customers…"
              className="h-9 rounded-lg pl-9"
            />
          </form>

          <select
            aria-label="Sort customers"
            className={selectClass}
            value={`${result.sort}:${result.dir}`}
            onChange={(event) => {
              const [sort, dir] = event.target.value.split(":") as [
                CustomerSort,
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

        <p className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {result.total} {result.total === 1 ? "Customer" : "Customers"}
        </p>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No customers found" : "No customers yet"}
          description={
            search
              ? "Try a different name, email or phone."
              : "Customers are created automatically when an order is placed."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear search
              </Button>
            ) : undefined
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
                    Customer
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Phone
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    Orders
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    Total spend
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Last order
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() =>
                      router.push(`/admin/customers/${customer.id}`)
                    }
                    className="border-border/70 group cursor-pointer border-b transition-colors last:border-0 hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} email={customer.email} />
                        <div className="min-w-0 leading-tight">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="font-medium hover:underline"
                          >
                            {customer.name ?? "Guest"}
                          </Link>
                          <div className="text-muted-foreground truncate text-xs">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-5 py-4">
                      {customer.phone ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {customer.orderCount}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums">
                      {formatPaise(customer.totalSpend)}
                    </td>
                    <td className="text-muted-foreground px-5 py-4">
                      {customer.lastOrderAt
                        ? dateFmt.format(new Date(customer.lastOrderAt))
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 lg:hidden">
            {result.items.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="bg-card rounded-2xl border p-4 transition-colors hover:border-white/20"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={customer.name} email={customer.email} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="truncate font-medium">
                      {customer.name ?? "Guest"}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {customer.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3 text-sm">
                  <span className="text-muted-foreground">
                    {customer.orderCount}{" "}
                    {customer.orderCount === 1 ? "order" : "orders"}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatPaise(customer.totalSpend)}
                  </span>
                </div>
              </Link>
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
    </div>
  );
}
