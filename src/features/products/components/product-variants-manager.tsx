"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Boxes, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

import { deleteVariantAction } from "../actions";
import { type VariantWithInventory } from "../types";
import { InventoryAdjustDialog } from "./inventory-adjust-dialog";
import { VariantFormDialog } from "./variant-form-dialog";

export function ProductVariantsManager({
  productId,
  variants,
}: {
  productId: string;
  variants: VariantWithInventory[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<VariantWithInventory | null>(null);
  const [adjusting, setAdjusting] = useState<VariantWithInventory | null>(null);
  const [deleting, setDeleting] = useState<VariantWithInventory | null>(null);
  const [working, setWorking] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setWorking(true);
    const result = await deleteVariantAction(productId, deleting.id);
    setWorking(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Variant deleted");
    setDeleting(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Variants &amp; inventory</CardTitle>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus /> Add variant
        </Button>
      </CardHeader>

      {variants.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 px-6 pb-8 text-center text-sm">
          <Boxes className="size-6" />
          <p>
            No variants yet. Add at least one so the product is purchasable.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Low-stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => {
                const quantity = variant.inventory?.quantity ?? 0;
                const reserved = variant.inventory?.reserved_quantity ?? 0;
                const threshold = variant.inventory?.low_stock_threshold ?? 0;
                const low = quantity <= threshold;
                return (
                  <TableRow key={variant.id}>
                    <TableCell className="font-mono text-xs">
                      {variant.sku}
                    </TableCell>
                    <TableCell>{variant.size ?? "—"}</TableCell>
                    <TableCell>{variant.color ?? "—"}</TableCell>
                    <TableCell>
                      {variant.price_override === null ? (
                        <span className="text-muted-foreground">Default</span>
                      ) : (
                        formatPaise(variant.price_override)
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "tabular-nums",
                          low && "text-warning font-medium",
                        )}
                      >
                        {quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {reserved}
                    </TableCell>
                    <TableCell className="text-right">
                      {low ? (
                        <Badge
                          variant="outline"
                          className="bg-warning/15 text-warning border-warning/20"
                        >
                          {threshold}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground tabular-nums">
                          {threshold}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdjusting(variant)}
                        >
                          <SlidersHorizontal /> Stock
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(variant);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleting(variant)}
                        >
                          <Trash2 />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <VariantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productId={productId}
        variant={editing}
        onSaved={() => router.refresh()}
      />
      <InventoryAdjustDialog
        open={adjusting !== null}
        onOpenChange={(next) => {
          if (!next) setAdjusting(null);
        }}
        productId={productId}
        variant={adjusting}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete variant?"
        description={`This permanently removes variant ${deleting?.sku ?? ""} and its stock history.`}
        confirmLabel="Delete"
        destructive
        loading={working}
        onConfirm={confirmDelete}
      />
    </Card>
  );
}
