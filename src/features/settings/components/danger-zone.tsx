"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";

import { archiveStoreDataAction, exportStoreDataAction } from "../actions";

export function DangerZone() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [archiving, setArchiving] = useState(false);

  async function exportData() {
    setExporting(true);
    const res = await exportStoreDataAction();
    setExporting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    const blob = new Blob([res.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dope-store-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  }

  async function archiveData() {
    if (confirmText.trim().toUpperCase() !== "ARCHIVE") {
      toast.error("Type ARCHIVE to confirm");
      return;
    }
    setArchiving(true);
    const res = await archiveStoreDataAction();
    setArchiving(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(
      res.data === 0
        ? "No active products to archive"
        : `Archived ${res.data} product${res.data === 1 ? "" : "s"}`,
    );
    setConfirmOpen(false);
    setConfirmText("");
    router.refresh();
  }

  return (
    <section className="border-destructive/30 bg-destructive/[0.03] space-y-5 rounded-2xl border p-5">
      <div className="space-y-0.5">
        <h2 className="font-heading text-destructive text-sm font-semibold">
          Danger zone
        </h2>
        <p className="text-muted-foreground text-xs">
          Nothing here deletes data — exports are read-only and archiving is
          reversible.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-white">Export store data</p>
          <p className="text-muted-foreground text-xs">
            Download a JSON snapshot of products, orders, customers and more.
          </p>
        </div>
        <Button variant="outline" onClick={exportData} disabled={exporting}>
          {exporting ? <Loader2 className="animate-spin" /> : <Download />}
          Export
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-white">Archive store data</p>
          <p className="text-muted-foreground text-xs">
            Move every active product to archived. You can restore products
            individually afterwards.
          </p>
        </div>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          Archive all products
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setConfirmText("");
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Archive all active products?</DialogTitle>
            <DialogDescription>
              They will be hidden from the storefront but nothing is deleted —
              you can restore them individually later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-muted-foreground text-xs">
              Type ARCHIVE to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="ARCHIVE"
              className="font-mono uppercase"
            />
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={archiving} />}
            >
              Cancel
            </DialogClose>
            <Button
              variant="destructive"
              disabled={
                archiving || confirmText.trim().toUpperCase() !== "ARCHIVE"
              }
              onClick={archiveData}
            >
              {archiving ? <Loader2 className="animate-spin" /> : null}
              Archive all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
