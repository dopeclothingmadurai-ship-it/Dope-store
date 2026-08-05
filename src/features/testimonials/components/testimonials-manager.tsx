"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Pencil,
  Plus,
  Star,
  Trash2,
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
import { type Testimonial } from "../types";
import { TestimonialFormDialog } from "./testimonial-form-dialog";

export function TestimonialsManager({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(testimonial: Testimonial) {
    setEditing(testimonial);
    setFormOpen(true);
  }

  async function toggleStatus(testimonial: Testimonial) {
    const next = testimonial.status === "published" ? "hidden" : "published";
    const result = await setTestimonialStatusAction(testimonial.id, next);
    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }
    toast.success(next === "hidden" ? "Hidden" : "Published");
    router.refresh();
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= testimonials.length) return;
    const ids = testimonials.map((item) => item.id);
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
            {testimonials.length}{" "}
            {testimonials.length === 1 ? "testimonial" : "testimonials"} ·
            curated for the storefront homepage.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus /> New testimonial
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          icon={MessageSquareQuote}
          title="No testimonials yet"
          description="Add real customer testimonials to feature them on the homepage. Only publish genuine reviews."
          action={
            <Button onClick={openNew} variant="outline">
              <Plus /> Add the first one
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {testimonials.map((testimonial, index) => (
            <li
              key={testimonial.id}
              className={cn(
                "rounded-xl border p-4 transition-colors",
                testimonial.status === "hidden"
                  ? "border-input bg-transparent opacity-60"
                  : "border-input bg-white/[0.02]",
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
                    {testimonial.featured ? (
                      <Badge variant="secondary">Featured</Badge>
                    ) : null}
                    {testimonial.verified_purchase ? (
                      <Badge variant="outline" className="gap-1">
                        <BadgeCheck className="size-3" /> Verified
                      </Badge>
                    ) : null}
                    {testimonial.status === "hidden" ? (
                      <Badge variant="outline">Hidden</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
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
                      disabled={index === testimonials.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={
                        testimonial.status === "published" ? "Hide" : "Publish"
                      }
                      onClick={() => toggleStatus(testimonial)}
                    >
                      {testimonial.status === "published" ? (
                        <EyeOff />
                      ) : (
                        <Eye />
                      )}
                    </Button>
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
