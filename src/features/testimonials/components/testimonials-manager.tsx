"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Check,
  MessageSquareQuote,
  Pencil,
  Plus,
  Star,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  deleteTestimonialAction,
  reorderTestimonialsAction,
  setTestimonialStatusAction,
} from "../actions";
import { type TestimonialStatus } from "../schema";
import { type Testimonial } from "../types";
import { TestimonialFormDialog } from "./testimonial-form-dialog";

type Filter = "all" | "pending" | "approved" | "rejected";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export function TestimonialsManager({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("pending");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(
    () => ({
      pending: testimonials.filter((t) => t.status === "pending").length,
      approved: testimonials.filter((t) => t.status === "approved").length,
      rejected: testimonials.filter((t) => t.status === "rejected").length,
      all: testimonials.length,
    }),
    [testimonials],
  );

  // Default the tab to whatever has content on first load.
  const effectiveFilter =
    filter === "pending" && counts.pending === 0 && counts.approved > 0
      ? "approved"
      : filter;

  const visible = useMemo(
    () =>
      effectiveFilter === "all"
        ? testimonials
        : testimonials.filter((t) => t.status === effectiveFilter),
    [testimonials, effectiveFilter],
  );

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(testimonial: Testimonial) {
    setEditing(testimonial);
    setFormOpen(true);
  }

  async function setStatus(testimonial: Testimonial, status: TestimonialStatus) {
    const result = await setTestimonialStatusAction(testimonial.id, status);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(
      status === "approved"
        ? "Approved — now live"
        : status === "rejected"
          ? "Rejected"
          : "Moved to pending",
    );
    router.refresh();
  }

  // Reorder among the currently-visible (approved) list.
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= visible.length) return;
    const ids = visible.map((item) => item.id);
    const current = ids[index];
    const swap = ids[target];
    if (current === undefined || swap === undefined) return;
    ids[index] = swap;
    ids[target] = current;
    const result = await reorderTestimonialsAction(ids);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteTestimonialAction(deleting.id);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Testimonial deleted");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Testimonials
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {counts.pending > 0
              ? `${counts.pending} awaiting approval · `
              : ""}
            {counts.approved} live on the homepage.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus /> New testimonial
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              effectiveFilter === key
                ? "border-white/20 bg-white/[0.08] text-white"
                : "border-input text-muted-foreground hover:bg-white/[0.03]",
            )}
          >
            {label}
            <span className="ml-1.5 tabular-nums opacity-60">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title={
            effectiveFilter === "pending"
              ? "No submissions to review"
              : "Nothing here yet"
          }
          description="Customer submissions land in Pending. Approve genuine ones to feature them on the homepage."
          action={
            <Button onClick={openNew} variant="outline">
              <Plus /> Add one manually
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((testimonial, index) => (
            <li
              key={testimonial.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                testimonial.status === "approved"
                  ? "border-input bg-white/[0.02]"
                  : "border-input bg-transparent",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {testimonial.customer_name}
                    </span>
                    {testimonial.location ? (
                      <span className="text-muted-foreground text-xs">
                        {testimonial.location}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, star) => (
                        <Star
                          key={star}
                          className={cn(
                            "size-3.5",
                            star < testimonial.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30",
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                    {testimonial.review}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusBadge status={testimonial.status} />
                    {testimonial.is_sample ? (
                      <Badge
                        variant="outline"
                        className="border-warning/40 text-warning"
                      >
                        Sample — replace
                      </Badge>
                    ) : null}
                    {testimonial.submitted_by_customer ? (
                      <Badge variant="outline">Customer</Badge>
                    ) : null}
                    {testimonial.featured ? (
                      <Badge variant="secondary">Featured</Badge>
                    ) : null}
                    {testimonial.verified_purchase ? (
                      <Badge variant="outline" className="gap-1">
                        <BadgeCheck className="size-3" /> Verified
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  {effectiveFilter === "approved" ? (
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move down"
                        disabled={index === visible.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  ) : null}
                  <div className="flex items-center">
                    {testimonial.status !== "approved" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Approve"
                        onClick={() => setStatus(testimonial, "approved")}
                      >
                        <Check className="text-success" />
                      </Button>
                    ) : null}
                    {testimonial.status !== "rejected" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Reject"
                        onClick={() => setStatus(testimonial, "rejected")}
                      >
                        <X className="text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Move to pending"
                        onClick={() => setStatus(testimonial, "pending")}
                      >
                        <Undo2 />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit"
                      onClick={() => openEdit(testimonial)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete"
                      onClick={() => setDeleting(testimonial)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TestimonialFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        testimonial={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete testimonial?"
        description={
          deleting
            ? `"${deleting.customer_name}" will be permanently removed.`
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

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge variant="outline" className="border-success/40 text-success">
        Approved
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="border-warning/40 text-warning">
        Pending
      </Badge>
    );
  }
  return <Badge variant="outline">Rejected</Badge>;
}
