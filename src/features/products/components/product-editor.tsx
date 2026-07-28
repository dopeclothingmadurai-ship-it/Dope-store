"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Archive, ArchiveRestore, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { LinkButton } from "@/components/admin/link-button";
import { ProductStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { archiveProductAction, restoreProductAction } from "../actions";
import { type InventoryMovementItem, type ProductDetail } from "../types";
import { InventoryHistory } from "./inventory-history";
import { ProductForm } from "./product-form";
import { ProductMediaManager } from "./product-media-manager";
import { ProductVariantsManager } from "./product-variants-manager";

type Option = { id: string; name: string };

export function ProductEditor({
  product,
  categories,
  collections,
  movements,
}: {
  product: ProductDetail;
  categories: Option[];
  collections: Option[];
  movements: InventoryMovementItem[];
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<"archive" | "restore" | null>(null);
  const [working, setWorking] = useState(false);
  const archived = product.status === "archived";

  async function run() {
    if (!confirm) return;
    setWorking(true);
    const result =
      confirm === "archive"
        ? await archiveProductAction(product.id)
        : await restoreProductAction(product.id);
    setWorking(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(
      confirm === "archive" ? "Product archived" : "Product restored",
    );
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <LinkButton
            variant="ghost"
            size="sm"
            className="-ml-2"
            href="/admin/catalog/products"
          >
            <ArrowLeft /> Products
          </LinkButton>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {product.title}
            </h1>
            <ProductStatusBadge status={product.status} />
          </div>
        </div>
        {archived ? (
          <Button variant="outline" onClick={() => setConfirm("restore")}>
            <ArchiveRestore /> Restore
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setConfirm("archive")}>
            <Archive /> Archive
          </Button>
        )}
      </div>

      {archived ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="font-medium">This product is archived</p>
            <p className="text-muted-foreground mx-auto max-w-md text-sm">
              Archived products are hidden from the storefront and can&apos;t be
              edited. Historical orders keep working. Restore it to make
              changes.
            </p>
            <Button onClick={() => setConfirm("restore")}>
              <ArchiveRestore /> Restore product
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <ProductForm
            product={product}
            categories={categories}
            collections={collections}
          />
          <ProductMediaManager productId={product.id} media={product.media} />
          <ProductVariantsManager
            productId={product.id}
            variants={product.variants}
          />
          <InventoryHistory movements={movements} />
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirm === "archive" ? "Archive product?" : "Restore product?"}
        description={
          confirm === "archive"
            ? "It will be hidden from the storefront. Historical orders keep working."
            : "It will return as a draft that you can edit and publish."
        }
        confirmLabel={confirm === "archive" ? "Archive" : "Restore"}
        destructive={confirm === "archive"}
        loading={working}
        onConfirm={run}
      />
    </div>
  );
}
