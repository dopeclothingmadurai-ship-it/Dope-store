"use client";

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
  ImageIcon,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { LinkButton } from "@/components/admin/link-button";
import { PageHeader } from "@/components/admin/page-header";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPaise } from "@/lib/money";

import { archiveProductAction, restoreProductAction } from "../actions";
import {
  type ProductListItem,
  type ProductListResult,
  type ProductSort,
} from "../types";

export function ProductsManager({
  result,
  search,
}: {
  result: ProductListResult;
  search: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(search);
  const [confirm, setConfirm] = useState<{
    product: ProductListItem;
    archive: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function navigate(next: {
    page?: number;
    q?: string;
    sort?: ProductSort;
    dir?: "asc" | "desc";
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    if (q) params.set("q", q);
    const page = next.page ?? 1;
    if (page > 1) params.set("page", String(page));
    const sort = next.sort ?? result.sort;
    const dir = next.dir ?? result.dir;
    if (sort !== "created" || dir !== "desc") {
      params.set("sort", sort);
      params.set("dir", dir);
    }
    const query = params.toString();
    router.push(`/admin/catalog/products${query ? `?${query}` : ""}`);
  }

  function toggleSort(column: ProductSort) {
    const dir: "asc" | "desc" =
      result.sort === column && result.dir === "asc" ? "desc" : "asc";
    navigate({ sort: column, dir, page: 1 });
  }

  function SortIcon({ column }: { column: ProductSort }) {
    if (result.sort !== column)
      return <ChevronsUpDown className="text-muted-foreground/50 size-3.5" />;
    return result.dir === "asc" ? (
      <ArrowUp className="size-3.5" />
    ) : (
      <ArrowDown className="size-3.5" />
    );
  }

  async function runConfirm() {
    if (!confirm) return;
    setWorking(true);
    const { product, archive } = confirm;
    const result = archive
      ? await archiveProductAction(product.id)
      : await restoreProductAction(product.id);
    setWorking(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(archive ? "Product archived" : "Product restored");
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Create and manage your catalog."
        actions={
          <LinkButton href="/admin/catalog/products/new">
            <Plus /> New product
          </LinkButton>
        }
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          navigate({ q: term, page: 1 });
        }}
        className="relative max-w-sm"
      >
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search products…"
          className="pl-8"
        />
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "No products match your search" : "No products yet"}
          description={
            search
              ? "Try a different search term."
              : "Create your first product to start building the catalog."
          }
          action={
            search ? undefined : (
              <LinkButton href="/admin/catalog/products/new">
                <Plus /> New product
              </LinkButton>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("title")}
                      className="hover:text-foreground -ml-1 flex items-center gap-1 rounded px-1"
                    >
                      Title
                      <SortIcon column="title" />
                    </button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort("price")}
                      className="hover:text-foreground ml-auto flex items-center gap-1 rounded px-1"
                    >
                      Price
                      <SortIcon column="price" />
                    </button>
                  </TableHead>
                  <TableHead className="w-24">
                    <button
                      type="button"
                      onClick={() => toggleSort("status")}
                      className="hover:text-foreground -ml-1 flex items-center gap-1 rounded px-1"
                    >
                      Status
                      <SortIcon column="status" />
                    </button>
                  </TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.primaryImageUrl ? (
                        <Image
                          src={product.primaryImageUrl}
                          alt={product.title}
                          width={40}
                          height={40}
                          unoptimized
                          className="size-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md">
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/catalog/products/${product.id}`}
                        className="flex items-center gap-1.5 font-medium hover:underline"
                      >
                        {product.title}
                        {product.featured ? (
                          <Star className="fill-warning text-warning size-3.5" />
                        ) : null}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.categoryName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPaise(product.base_price)}
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={product.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <LinkButton
                          size="icon-sm"
                          variant="ghost"
                          href={`/admin/catalog/products/${product.id}`}
                        >
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </LinkButton>
                        {product.status === "archived" ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              setConfirm({ product, archive: false })
                            }
                          >
                            <ArchiveRestore />
                            <span className="sr-only">Restore</span>
                          </Button>
                        ) : (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              setConfirm({ product, archive: true })
                            }
                          >
                            <Archive />
                            <span className="sr-only">Archive</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {result.total} product{result.total === 1 ? "" : "s"}
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
              <span className="text-muted-foreground text-sm">
                Page {result.page} of {totalPages}
              </span>
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
        </>
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
    </div>
  );
}
