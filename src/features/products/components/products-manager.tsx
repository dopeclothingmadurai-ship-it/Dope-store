"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Copy,
  ImageIcon,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { ExportButton } from "@/components/admin/export-button";
import { LinkButton } from "@/components/admin/link-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  archiveProductAction,
  duplicateProductAction,
  restoreProductAction,
} from "../actions";
import { BulkActionBar } from "./bulk-action-bar";
import { useProductSelection } from "./use-product-selection";
import {
  type ProductListItem,
  type ProductListResult,
  type ProductSort,
  type ProductStatus,
} from "../types";

type Option = { id: string; name: string };

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 rounded-lg border px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created:desc", label: "Newest first" },
  { value: "created:asc", label: "Oldest first" },
  { value: "title:asc", label: "Title A–Z" },
  { value: "title:desc", label: "Title Z–A" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
];

const STATUS_STYLES: Record<
  ProductStatus,
  { dot: string; pill: string; label: string }
> = {
  active: {
    dot: "bg-success",
    pill: "bg-success/10 text-success border-success/20",
    label: "Active",
  },
  draft: {
    dot: "bg-muted-foreground",
    pill: "bg-white/5 text-muted-foreground border-white/10",
    label: "Draft",
  },
  archived: {
    dot: "bg-destructive",
    pill: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Archived",
  },
};

function StatusPill({ status }: { status: ProductStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        s.pill,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

function formatAmount(paise: number): string {
  const whole = paise % 100 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(paise / 100);
}

function Thumbnail({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-muted group/thumb relative shrink-0 overflow-hidden rounded-lg border border-white/[0.06]",
        className,
      )}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          unoptimized
          sizes="56px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center">
          <ImageIcon className="size-4" />
        </div>
      )}
    </div>
  );
}

function Inventory({ product }: { product: ProductListItem }) {
  if (product.variantCount === 0) {
    return (
      <span className="text-muted-foreground/70 text-sm">No variants</span>
    );
  }
  const dot = product.outOfStock
    ? "bg-destructive"
    : product.lowStock
      ? "bg-warning"
      : "bg-success";
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} />
      <div className="leading-tight">
        <div className="text-sm font-medium tabular-nums">
          {product.available}{" "}
          <span className="text-muted-foreground font-normal">available</span>
        </div>
        {product.reserved > 0 ? (
          <div className="text-muted-foreground text-xs tabular-nums">
            {product.reserved} reserved
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Price({ paise }: { paise: number }) {
  return (
    <div className="leading-tight">
      <div className="font-semibold tabular-nums">{formatAmount(paise)}</div>
      <div className="text-muted-foreground text-[11px] tracking-wide">INR</div>
    </div>
  );
}

function CollectionBadge({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  const extra = names.length - 1;
  return (
    <span className="border-border text-muted-foreground inline-flex max-w-[160px] items-center gap-1 truncate rounded-md border px-1.5 py-0.5 text-[11px]">
      <span className="truncate">{names[0]}</span>
      {extra > 0 ? <span className="opacity-70">+{extra}</span> : null}
    </span>
  );
}

function RowActions({
  product,
  onDuplicate,
  onArchiveToggle,
}: {
  product: ProductListItem;
  onDuplicate: (product: ProductListItem) => void;
  onArchiveToggle: (product: ProductListItem, archive: boolean) => void;
}) {
  const router = useRouter();
  const href = `/admin/catalog/products/${product.id}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Product actions" />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => router.push(href)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDuplicate(product)}>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {product.status === "archived" ? (
          <DropdownMenuItem onClick={() => onArchiveToggle(product, false)}>
            <ArchiveRestore /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onArchiveToggle(product, true)}
          >
            <Archive /> Archive
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductsManager({
  result,
  search,
  categories,
  collections,
}: {
  result: ProductListResult;
  search: string;
  categories: Option[];
  collections: Option[];
}) {
  const router = useRouter();
  const { filters } = result;
  const [term, setTerm] = useState(search);
  const [confirm, setConfirm] = useState<{
    product: ProductListItem;
    archive: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);

  const {
    ids: selectedIds,
    toggle: toggleSelected,
    setMany: setManySelected,
    clear: clearSelection,
  } = useProductSelection();
  const pageIds = result.items.map((product) => product.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected =
    !allPageSelected && pageIds.some((id) => selectedIds.has(id));

  function clearAndRefresh() {
    clearSelection();
    router.refresh();
  }

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const filtersActive = Boolean(
    search || filters.status || filters.categoryId || filters.collectionId,
  );
  const animationKey = `${result.page}:${result.sort}:${result.dir}:${search}:${filters.status}:${filters.categoryId}:${filters.collectionId}`;

  function navigate(next: {
    page?: number;
    q?: string;
    status?: ProductStatus | null;
    category?: string | null;
    collection?: string | null;
    sort?: ProductSort;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    if (q) params.set("q", q);

    const status = next.status !== undefined ? next.status : filters.status;
    if (status) params.set("status", status);
    const category =
      next.category !== undefined ? next.category : filters.categoryId;
    if (category) params.set("category", category);
    const collection =
      next.collection !== undefined ? next.collection : filters.collectionId;
    if (collection) params.set("collection", collection);

    const sort = next.sort ?? result.sort;
    const dir = next.dir ?? result.dir;
    if (sort !== "created" || dir !== "desc") {
      params.set("sort", sort);
      params.set("dir", dir);
    }

    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    router.push(`/admin/catalog/products${qs ? `?${qs}` : ""}`);
  }

  function toggleSort(column: ProductSort) {
    const dir: "asc" | "desc" =
      result.sort === column && result.dir === "asc" ? "desc" : "asc";
    navigate({ sort: column, dir, page: 1 });
  }

  function SortIcon({ column }: { column: ProductSort }) {
    if (result.sort !== column)
      return <ChevronsUpDown className="text-muted-foreground/40 size-3.5" />;
    return result.dir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  }

  function clearFilters() {
    setTerm("");
    navigate({
      q: "",
      status: null,
      category: null,
      collection: null,
      page: 1,
    });
  }

  async function runConfirm() {
    if (!confirm) return;
    setWorking(true);
    const { product, archive } = confirm;
    const res = archive
      ? await archiveProductAction(product.id)
      : await restoreProductAction(product.id);
    setWorking(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(archive ? "Product archived" : "Product restored");
    setConfirm(null);
    router.refresh();
  }

  const onArchiveToggle = (product: ProductListItem, archive: boolean) =>
    setConfirm({ product, archive });

  async function handleDuplicate(product: ProductListItem) {
    const res = await duplicateProductAction(product.id);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`Duplicated as “${res.data.title}”`);
    router.push(`/admin/catalog/products/${res.data.id}`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
            Products
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your product catalog, inventory and merchandising.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton entity="products" />
          <LinkButton
            href="/admin/catalog/products/new"
            className="h-10 rounded-full px-5 shadow-lg shadow-black/30 transition-transform hover:-translate-y-0.5"
          >
            <Plus /> New Product
          </LinkButton>
        </div>
      </div>

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
              placeholder="Search products…"
              className="h-9 rounded-lg pl-9"
            />
          </form>

          <select
            aria-label="Filter by status"
            className={selectClass}
            value={filters.status ?? ""}
            onChange={(event) =>
              navigate({
                status: (event.target.value || null) as ProductStatus | null,
                page: 1,
              })
            }
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            aria-label="Filter by category"
            className={selectClass}
            value={filters.categoryId ?? ""}
            onChange={(event) =>
              navigate({ category: event.target.value || null, page: 1 })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by collection"
            className={selectClass}
            value={filters.collectionId ?? ""}
            onChange={(event) =>
              navigate({ collection: event.target.value || null, page: 1 })
            }
          >
            <option value="">All collections</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Sort products"
            className={selectClass}
            value={`${result.sort}:${result.dir}`}
            onChange={(event) => {
              const [sort, dir] = event.target.value.split(":") as [
                ProductSort,
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
          {result.total} {result.total === 1 ? "Product" : "Products"}
        </p>
      </div>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            search || filtersActive ? "No products found" : "No products yet"
          }
          description={
            search || filtersActive
              ? "Try adjusting your search or filters."
              : "Start building your luxury catalog."
          }
          action={
            filtersActive ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <LinkButton href="/admin/catalog/products/new">
                <Plus /> Create Product
              </LinkButton>
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
          <div className="hidden overflow-hidden rounded-2xl border md:block">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="border-border border-b">
                  <th className="w-10 py-3 pr-2 pl-5">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onCheckedChange={(checked) =>
                        setManySelected(pageIds, checked === true)
                      }
                    />
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("title")}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      Product <SortIcon column="title" />
                    </button>
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Category
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    Inventory
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-left text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="hover:text-foreground flex items-center gap-1"
                    >
                      Status <SortIcon column="status" />
                    </button>
                  </th>
                  <th className="text-muted-foreground px-5 py-3 text-right text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("price")}
                      className="hover:text-foreground ml-auto flex items-center gap-1"
                    >
                      Price <SortIcon column="price" />
                    </button>
                  </th>
                  <th className="w-12 px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.items.map((product) => (
                  <tr
                    key={product.id}
                    className={cn(
                      "border-border/70 group border-b transition-colors last:border-0 hover:bg-white/[0.03]",
                      selectedIds.has(product.id) && "bg-white/[0.04]",
                    )}
                  >
                    <td className="py-4 pr-2 pl-5">
                      <Checkbox
                        aria-label={`Select ${product.title}`}
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelected(product.id)}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Thumbnail
                          url={product.primaryImageUrl}
                          alt={product.title}
                          className="size-12"
                        />
                        <div className="min-w-0 space-y-1">
                          <Link
                            href={`/admin/catalog/products/${product.id}`}
                            className="flex items-center gap-1.5 font-medium hover:underline"
                          >
                            <span className="truncate">{product.title}</span>
                            {product.featured ? (
                              <span
                                className="bg-warning size-1.5 shrink-0 rounded-full"
                                title="Featured"
                              />
                            ) : null}
                          </Link>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-mono text-xs">
                              {product.sku ?? "—"}
                            </span>
                            <CollectionBadge names={product.collectionNames} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-5 py-4">
                      {product.categoryName ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <Inventory product={product} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusPill status={product.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Price paise={product.base_price} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RowActions
                        product={product}
                        onDuplicate={handleDuplicate}
                        onArchiveToggle={onArchiveToggle}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {result.items.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "bg-card rounded-2xl border p-4 transition-colors hover:border-white/20",
                  selectedIds.has(product.id) &&
                    "border-white/25 bg-white/[0.04]",
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    aria-label={`Select ${product.title}`}
                    className="mt-1"
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelected(product.id)}
                  />
                  <Thumbnail
                    url={product.primaryImageUrl}
                    alt={product.title}
                    className="size-16"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/admin/catalog/products/${product.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {product.title}
                      </Link>
                      <RowActions
                        product={product}
                        onDuplicate={handleDuplicate}
                        onArchiveToggle={onArchiveToggle}
                      />
                    </div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {product.sku ?? "—"}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StatusPill status={product.status} />
                      <CollectionBadge names={product.collectionNames} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <Inventory product={product} />
                  <Price paise={product.base_price} />
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

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirm?.archive ? "Archive product?" : "Restore product?"}
        description={
          confirm?.archive
            ? "It will be hidden from the storefront. Historical orders keep working."
            : "It will return as a draft."
        }
        confirmLabel={confirm?.archive ? "Archive" : "Restore"}
        destructive={confirm?.archive ?? false}
        loading={working}
        onConfirm={runConfirm}
      />

      <BulkActionBar
        ids={[...selectedIds]}
        categories={categories}
        collections={collections}
        onDone={clearAndRefresh}
      />
    </div>
  );
}
