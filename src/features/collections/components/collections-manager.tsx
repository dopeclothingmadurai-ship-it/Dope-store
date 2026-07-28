"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Layers,
  Pencil,
  Plus,
  Star,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { LinkButton } from "@/components/admin/link-button";
import { PageHeader } from "@/components/admin/page-header";
import { ArchivedBadge } from "@/components/admin/status-badge";
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

import { archiveCollectionAction, restoreCollectionAction } from "../actions";
import { type Collection, type CollectionListItem } from "../types";
import { CollectionFormDialog } from "./collection-form-dialog";

export function CollectionsManager({
  collections,
}: {
  collections: CollectionListItem[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [confirm, setConfirm] = useState<{
    collection: CollectionListItem;
    archive: boolean;
  } | null>(null);
  const [working, setWorking] = useState(false);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    setWorking(true);
    const { collection, archive } = confirm;
    const result = archive
      ? await archiveCollectionAction(collection.id)
      : await restoreCollectionAction(collection.id);
    setWorking(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(archive ? "Collection archived" : "Collection restored");
    setConfirm(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Group products into manual or featured collections."
        actions={
          <Button onClick={openCreate}>
            <Plus /> New collection
          </Button>
        }
      />

      {collections.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No collections yet"
          description="Create a collection to feature and group products."
          action={
            <Button onClick={openCreate}>
              <Plus /> New collection
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-24">Products</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 font-medium">
                      {collection.name}
                      {collection.is_featured ? (
                        <Star className="fill-warning text-warning size-3.5" />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {collection.slug}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {collection.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{collection.productCount}</TableCell>
                  <TableCell>
                    <ArchivedBadge archived={collection.archived_at !== null} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <LinkButton
                        size="sm"
                        variant="outline"
                        href={`/admin/catalog/collections/${collection.id}`}
                      >
                        Products
                      </LinkButton>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(collection);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil />
                        <span className="sr-only">Edit</span>
                      </Button>
                      {collection.archived_at ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() =>
                            setConfirm({ collection, archive: false })
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
                            setConfirm({ collection, archive: true })
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
      )}

      <CollectionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        collection={editing}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(next) => {
          if (!next) setConfirm(null);
        }}
        title={confirm?.archive ? "Archive collection?" : "Restore collection?"}
        description={
          confirm?.archive
            ? "Archived collections are hidden from the storefront."
            : "This collection will be visible on the storefront again."
        }
        confirmLabel={confirm?.archive ? "Archive" : "Restore"}
        destructive={confirm?.archive ?? false}
        loading={working}
        onConfirm={runConfirm}
      />
    </div>
  );
}
