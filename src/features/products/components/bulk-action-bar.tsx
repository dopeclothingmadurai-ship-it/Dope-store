"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Archive,
  Copy,
  DollarSign,
  FolderTree,
  Layers,
  MoreHorizontal,
  Package,
  PackageX,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { type Result } from "@/lib/result";
import { cn } from "@/lib/utils";

import {
  bulkBrandAction,
  bulkCategoryAction,
  bulkCollectionAction,
  bulkDeleteAction,
  bulkDuplicateAction,
  bulkStatusAction,
  bulkTagsAction,
} from "../bulk-actions";
import { BulkInventoryDialog } from "./bulk-inventory-dialog";
import { BulkPriceDialog } from "./bulk-price-dialog";

type Option = { id: string; name: string };

type ConfirmKind = "archive" | "delete";
type FieldKind = "category" | "collection" | "brand" | "tags" | null;

const selectClass = cn(
  "text-foreground border-input bg-white/[0.02] hover:bg-white/[0.04] h-9 w-full rounded-lg border px-3 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
);

const CONFIRM_COPY: Record<
  ConfirmKind,
  { title: string; description: string; label: string; destructive: boolean }
> = {
  archive: {
    title: "Archive products?",
    description:
      "Selected products are hidden from the storefront. You can restore them later.",
    label: "Archive",
    destructive: true,
  },
  delete: {
    title: "Delete products permanently?",
    description:
      "This removes the products, their variants, media and stock. Past orders keep their line items. This cannot be undone.",
    label: "Delete",
    destructive: true,
  },
};

export function BulkActionBar({
  ids,
  categories,
  collections,
  onDone,
}: {
  ids: string[];
  categories: Option[];
  collections: Option[];
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmKind | null>(null);
  const [field, setField] = useState<FieldKind>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);

  // Field-dialog inputs
  const [categoryId, setCategoryId] = useState<string>("");
  const [collectionId, setCollectionId] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [tagsInput, setTagsInput] = useState<string>("");
  const [tagsAdd, setTagsAdd] = useState(true);

  const count = ids.length;

  function finish(res: Result<number>, verb: string) {
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(`${verb} ${res.data} product${res.data === 1 ? "" : "s"}`);
    setConfirm(null);
    setField(null);
    onDone();
  }

  // Safe actions run in one click, no dialog.
  async function runImmediate(
    run: () => Promise<Result<number>>,
    verb: string,
  ) {
    setBusy(true);
    finish(await run(), verb);
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    if (confirm === "archive")
      finish(await bulkStatusAction(ids, "archived"), "Archived");
    else finish(await bulkDeleteAction(ids), "Deleted");
  }

  function openField(kind: Exclude<FieldKind, null>) {
    setCategoryId("");
    setCollectionId("");
    setBrand("");
    setTagsInput("");
    setTagsAdd(true);
    setField(kind);
  }

  async function submitField() {
    setBusy(true);
    if (field === "category") {
      finish(
        await bulkCategoryAction(ids, { categoryId: categoryId || null }),
        "Updated",
      );
    } else if (field === "collection") {
      if (!collectionId) {
        setBusy(false);
        toast.error("Choose a collection");
        return;
      }
      finish(await bulkCollectionAction(ids, { collectionId }), "Added");
    } else if (field === "brand") {
      finish(
        await bulkBrandAction(ids, { brand: brand.trim() || null }),
        "Updated",
      );
    } else if (field === "tags") {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (tags.length === 0) {
        setBusy(false);
        toast.error("Enter at least one tag");
        return;
      }
      finish(await bulkTagsAction(ids, { tags, add: tagsAdd }), "Updated");
    }
  }

  const confirmCopy = confirm ? CONFIRM_COPY[confirm] : null;

  return (
    <>
      <AnimatePresence>
        {count > 0 ? (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
          >
            <div className="bg-popover/95 flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex shrink-0 items-center gap-2 pr-1 pl-2">
                <span className="text-sm font-medium whitespace-nowrap text-white tabular-nums">
                  {count} selected
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onDone}
                  title="Clear selection"
                >
                  <X />
                </Button>
              </div>
              <span className="bg-border h-6 w-px shrink-0" />

              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={busy}
                onClick={() =>
                  runImmediate(
                    () => bulkStatusAction(ids, "active"),
                    "Published",
                  )
                }
              >
                <Package /> Publish
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={busy}
                onClick={() => setPriceOpen(true)}
              >
                <DollarSign /> Price
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                disabled={busy}
                onClick={() => setInventoryOpen(true)}
              >
                <Upload /> Stock
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={busy}
                    />
                  }
                >
                  <MoreHorizontal /> More actions
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  className="min-w-52"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      runImmediate(
                        () => bulkStatusAction(ids, "draft"),
                        "Unpublished",
                      )
                    }
                  >
                    <PackageX /> Unpublish
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      runImmediate(() => bulkDuplicateAction(ids), "Duplicated")
                    }
                  >
                    <Copy /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openField("category")}>
                    <FolderTree /> Change category
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openField("collection")}>
                    <Layers /> Add to collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openField("brand")}>
                    <Tag /> Update brand
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openField("tags")}>
                    <Tag /> Add / remove tags
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setConfirm("archive")}>
                    <Archive /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirm("delete")}
                  >
                    <Trash2 /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Destructive-only confirmations */}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirmCopy?.title ?? ""}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy ? `${confirmCopy.label} ${count}` : "Confirm"}
        destructive={confirmCopy?.destructive ?? false}
        loading={busy}
        onConfirm={runConfirm}
      />

      {/* Field dialogs */}
      <Dialog
        open={field !== null}
        onOpenChange={(next) => {
          if (!next) setField(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              {field === "category"
                ? "Change category"
                : field === "collection"
                  ? "Add to collection"
                  : field === "brand"
                    ? "Update brand"
                    : "Add or remove tags"}
            </DialogTitle>
            <DialogDescription>
              Applies to {count} selected product{count === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>

          {field === "category" ? (
            <select
              aria-label="Category"
              className={selectClass}
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : null}

          {field === "collection" ? (
            <select
              aria-label="Collection"
              className={selectClass}
              value={collectionId}
              onChange={(event) => setCollectionId(event.target.value)}
            >
              <option value="">Choose a collection…</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          ) : null}

          {field === "brand" ? (
            <Input
              placeholder="Brand name (blank to clear)"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
            />
          ) : null}

          {field === "tags" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, label: "Add tags" },
                  { value: false, label: "Remove tags" },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setTagsAdd(option.value)}
                    className={cn(
                      "h-9 rounded-lg border text-sm transition-colors",
                      tagsAdd === option.value
                        ? "border-white/20 bg-white/[0.08] text-white"
                        : "border-input text-muted-foreground hover:bg-white/[0.03]",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Input
                placeholder="summer, sale, new (comma separated)"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
              />
            </div>
          ) : null}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" disabled={busy} />}>
              Cancel
            </DialogClose>
            <Button onClick={submitField} disabled={busy}>
              {busy ? "Working…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BulkPriceDialog
        open={priceOpen}
        onOpenChange={setPriceOpen}
        ids={ids}
        onDone={onDone}
      />
      <BulkInventoryDialog
        open={inventoryOpen}
        onOpenChange={setInventoryOpen}
        ids={ids}
        onDone={onDone}
      />
    </>
  );
}
