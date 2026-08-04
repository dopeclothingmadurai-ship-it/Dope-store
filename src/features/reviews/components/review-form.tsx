"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { submitReviewAction } from "../actions";
import { type ProductReview } from "../types";

export function ReviewForm({
  productId,
  productSlug,
  existing,
}: {
  productId: string;
  productSlug: string;
  existing: ProductReview | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (rating < 1) {
      setError("Choose a rating.");
      return;
    }

    setSubmitting(true);
    const result = await submitReviewAction(
      { productId, rating, body },
      productSlug,
    );
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDone(true);
    router.refresh();
  }

  const active = hover || rating;

  return (
    <form onSubmit={onSubmit} className="border-border border p-6 sm:p-8">
      <p className="text-foreground/80 text-[12px] font-medium tracking-[0.18em] uppercase">
        {existing ? "Edit your review" : "Write a review"}
      </p>

      <div className="mt-5 flex items-center gap-1.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  value <= active
                    ? "fill-gold text-gold"
                    : "text-muted-foreground/40 hover:text-muted-foreground",
                )}
              />
            </button>
          );
        })}
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="How does it fit? How's the quality?"
        className="border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 mt-5 w-full resize-none border px-4 py-3 text-sm transition-colors outline-none focus:ring-1"
      />

      {error ? <p className="text-destructive mt-3 text-xs">{error}</p> : null}
      {done ? (
        <p className="text-gold mt-3 text-xs">
          Thanks — your review is published.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="bg-foreground text-background mt-6 flex h-11 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting
          ? "Submitting…"
          : existing
            ? "Update review"
            : "Submit review"}
      </button>
    </form>
  );
}
