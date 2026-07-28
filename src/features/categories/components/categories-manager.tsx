"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  FolderTree,
  ImageIcon,
  Pencil,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { ArchivedBadge } from "@/components/admin/status-badge";
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

import {
  archiveCategoryAction,
  reorderCategoriesAction,
  restoreCategoryAction,
} from "../actions";
import { type Category } from "../types";
import { CategoryFormDialog } from "./category-form-dialog";

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirm, setConfirm] = useState<{
    category: Category;
    archive: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);
  const [term, setTerm] = useState("");

  const query = term.trim().toLowerCase();
  const filtered = query
    ? categories.filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          category.slug.toLowerCase().includes(query),
      )
    : categories;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    const result = await reorderCategoriesAction(next.map((c) => c.id));
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    router.refresh();
  }

  async function runConfirm() {
    if (!confirm) return;
    setWorking(true);
    const { category, archive } = confirm;
    const result = archive
      ? await archiveCategoryAction(category.id)
      : await restoreCategoryAction(category.id);
    setWorking(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(archive ? "Category archived" : "Category restored");
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Single-level product categories."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New category
          </Button>
        }
      />

      {categories.length > 0 ? (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search categories…"
            className="pl-8"
          />
        </div>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to organize products."
          action={
            <Button onClick={openCreate}>
              <Plus /> New category
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No categories match your search"
          description="Try a different search term."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Order</TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((category) => {
                const index = categories.indexOf(category);
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={!!query || index === 0}
                          onClick={() => move(index, -1)}
                        >
                          <ArrowUp />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          disabled={!!query || index === categories.length - 1}
                          onClick={() => move(index, 1)}
                        >
                          <ArrowDown />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {category.image_url ? (
                        <Image
                          src={category.image_url}
                          alt={category.name}
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
                      <div className="font-medium">{category.name}</div>
                      {category.description ? (
                        <div className="text-muted-foreground line-clamp-1 max-w-xs text-xs">
                          {category.description}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {category.slug}
                    </TableCell>
                    <TableCell>
                      <ArchivedBadge archived={category.archived_at !== null} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => openEdit(category)}
                        >
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {category.archived_at ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() =>
                              setConfirm({ category, archive: false })
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
                              setConfirm({ category, archive: true })
                            }
                          >
                            <Archive />
                            <span className="sr-only">Archive</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirm?.archive ? "Archive category?" : "Restore category?"}
        description={
          confirm?.archive
            ? "Archived categories are hidden from the storefront."
            : "This category will be visible on the storefront again."
        }
        confirmLabel={confirm?.archive ? "Archive" : "Restore"}
        destructive={confirm?.archive ?? false}
        loading={working}
        onConfirm={runConfirm}
      />
    </div>
  );
}
