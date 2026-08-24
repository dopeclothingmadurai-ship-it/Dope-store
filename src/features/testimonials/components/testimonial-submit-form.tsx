"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { submitTestimonialAction } from "../actions";

export function TestimonialSubmitForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const [name, setName] = useState(defaultName);
  const [location, setLocation] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const active = hover || rating;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Choose a rating.");
      return;
    }
    setSubmitting(true);
    const result = await submitTestimonialAction({
      customerName: name,
      review,
      rating,
      location: location || null,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="border-border flex flex-col items-center border border-dashed px-6 py-14 text-center">
        <span className="border-gold/40 text-gold flex size-12 items-center justify-center rounded-full border">
          <Check className="size-5" />
        </span>
        <p className="text-foreground mt-5 text-sm font-medium">
          Thank you — your testimonial was submitted.
        </p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm leading-relaxed">
          It will appear here once our team approves it. We only publish genuine
          voices from the culture.
        </p>
      </div>
    );
  }

  const inputClass =
    "border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 h-12 w-full border px-4 text-sm transition-colors outline-none focus:ring-1";

  return (
    <form onSubmit={onSubmit} className="border-border border p-6 sm:p-8">
      <p className="text-foreground/80 text-[12px] font-medium tracking-[0.18em] uppercase">
        Share your experience
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

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          className={inputClass}
          placeholder="Your name"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          required
          aria-label="Your name"
        />
        <input
          className={inputClass}
          placeholder="City (optional)"
          value={location}
          maxLength={80}
          onChange={(event) => setLocation(event.target.value)}
          aria-label="City"
        />
      </div>

      <textarea
        value={review}
        onChange={(event) => setReview(event.target.value)}
        rows={4}
        maxLength={1000}
        aria-label="Your testimonial"
        placeholder="Tell us how Dope fits into your world…"
        className="border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 mt-3 w-full resize-none border px-4 py-3 text-sm transition-colors outline-none focus:ring-1"
      />

      {error ? <p className="text-destructive mt-3 text-xs">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="bg-foreground text-background mt-6 flex h-11 items-center justify-center px-8 text-[12px] font-medium tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit testimonial"}
      </button>
      <p className="text-muted-foreground mt-3 text-[11px]">
        Submitted testimonials are reviewed before they appear.
      </p>
    </form>
  );
}
