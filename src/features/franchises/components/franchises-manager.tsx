"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Power, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { FormRow } from "@/components/admin/form-row";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createFranchiseAction,
  deleteFranchiseAction,
  setFranchiseStatusAction,
  updateFranchiseAction,
} from "../actions";
import { type FranchiseFormValues } from "../schema";
import { type Franchise } from "../types";

const EMPTY: FranchiseFormValues = {
  name: "",
  city: "",
  location: "",
  phone: "",
  email: "",
  address: "",
  status: "active",
  notes: "",
};

export function FranchisesManager({
  franchises,
}: {
  franchises: Franchise[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Franchise | null>(null);
  const [deleting, setDeleting] = useState<Franchise | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(franchise: Franchise) {
    setEditing(franchise);
    setFormOpen(true);
  }

  async function toggleStatus(franchise: Franchise) {
    const next = franchise.status === "active" ? "inactive" : "active";
    const result = await setFranchiseStatusAction(franchise.id, next);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(next === "active" ? "Enabled" : "Disabled");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteFranchiseAction(deleting.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Franchise deleted");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Franchises</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {franchises.length}{" "}
            {franchises.length === 1 ? "location" : "locations"} · Dope Store
            branch directory.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus /> New franchise
        </Button>
      </div>

      {franchises.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No franchises yet"
          description="Add Dope Store branch/franchise locations to keep the directory up to date."
          action={
            <Button onClick={openNew} variant="outline">
              <Plus /> Add the first one
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {franchises.map((franchise) => (
            <li
              key={franchise.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                franchise.status === "inactive"
                  ? "border-input bg-transparent opacity-60"
                  : "border-input bg-white/[0.02]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{franchise.name}</span>
                    {franchise.status === "inactive" ? (
                      <Badge variant="outline">Disabled</Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-success/40 text-success"
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                  {franchise.city || franchise.location ? (
                    <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
                      <MapPin className="size-3.5" />
                      {[franchise.location, franchise.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  ) : null}
                  <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 text-xs">
                    {franchise.phone ? <span>{franchise.phone}</span> : null}
                    {franchise.email ? <span>{franchise.email}</span> : null}
                  </div>
                  {franchise.address ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {franchise.address}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      franchise.status === "active" ? "Disable" : "Enable"
                    }
                    onClick={() => toggleStatus(franchise)}
                  >
                    <Power />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit"
                    onClick={() => openEdit(franchise)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    onClick={() => setDeleting(franchise)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FranchiseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        franchise={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete franchise?"
        description={
          deleting
            ? `"${deleting.name}" will be permanently removed.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function FranchiseFormDialog({
  open,
  onOpenChange,
  franchise,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchise: Franchise | null;
  onSaved: () => void;
}) {
  const isEdit = franchise !== null;
  const [values, setValues] = useState<FranchiseFormValues>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(
      franchise
        ? {
            name: franchise.name,
            city: franchise.city ?? "",
            location: franchise.location ?? "",
            phone: franchise.phone ?? "",
            email: franchise.email ?? "",
            address: franchise.address ?? "",
            status: franchise.status === "inactive" ? "inactive" : "active",
            notes: franchise.notes ?? "",
          }
        : EMPTY,
    );
  }, [open, franchise]);

  function set<K extends keyof FranchiseFormValues>(
    key: K,
    value: FranchiseFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const result = isEdit
      ? await updateFranchiseAction(franchise.id, values)
      : await createFranchiseAction(values);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(isEdit ? "Franchise updated" : "Franchise added");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit franchise" : "New franchise"}
          </DialogTitle>
          <DialogDescription>
            Basic details for a Dope Store branch/franchise location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <FormRow label="Franchise name" htmlFor="f-name" required>
            <Input
              id="f-name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Dope Store — Anna Nagar"
              required
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-4">
            <FormRow label="City" htmlFor="f-city">
              <Input
                id="f-city"
                value={values.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Madurai"
              />
            </FormRow>
            <FormRow label="Area / location" htmlFor="f-loc">
              <Input
                id="f-loc"
                value={values.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Anna Nagar"
              />
            </FormRow>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Phone" htmlFor="f-phone">
              <Input
                id="f-phone"
                value={values.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="8754431324"
              />
            </FormRow>
            <FormRow label="Email" htmlFor="f-email">
              <Input
                id="f-email"
                value={values.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="branch@dope…"
              />
            </FormRow>
          </div>

          <FormRow label="Address" htmlFor="f-addr">
            <Textarea
              id="f-addr"
              rows={2}
              value={values.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Street, area, city, PIN"
            />
          </FormRow>

          <FormRow label="Notes" htmlFor="f-notes" hint="Internal — optional">
            <Textarea
              id="f-notes"
              rows={2}
              value={values.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
            />
          </FormRow>

          <div className="grid grid-cols-2 gap-2">
            {(["active", "inactive"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => set("status", option)}
                className={cn(
                  "h-9 rounded-lg border text-sm capitalize transition-colors",
                  values.status === option
                    ? "border-white/20 bg-white/[0.08] text-white"
                    : "border-input text-muted-foreground hover:bg-white/[0.03]",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
