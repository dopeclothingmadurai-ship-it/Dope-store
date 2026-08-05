"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { submitReviewAction } from "../actions";
import { MAX_REVIEW_IMAGES } from "../schema";
import { type ProductReview } from "../types";

type NewImage = { id: string; file: File; preview: string };

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
  const fileInput = useRef<HTMLInputElement>(null);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [keptUrls, setKeptUrls] = useState<string[]>(existing?.imageUrls ?? []);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalImages = keptUrls.length + newImages.length;
  const canAddImage = totalImages < MAX_REVIEW_IMAGES;

  // Revoke any outstanding preview object URLs when the form unmounts, so we
  // don't leak them if the customer navigates away without submitting.
  const newImagesRef = useRef(newImages);
  newImagesRef.current = newImages;
  useEffect(
    () => () => {
      for (const image of newImagesRef.current) {
        URL.revokeObjectURL(image.preview);
      }
    },
    [],
  );

  function onPickFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const room = MAX_REVIEW_IMAGES - totalImages;
    const next = files.slice(0, Math.max(0, room)).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages((current) => [...current, ...next]);
    event.target.value = "";
  }

  function removeNew(id: string) {
    setNewImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((image) => image.id !== id);
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);

    if (rating < 1) {
      setError("Choose a rating.");
      return;
    }

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("rating", String(rating));
    formData.set("body", body);
    for (const url of keptUrls) formData.append("keptImageUrls", url);
    for (const image of newImages) formData.append("images", image.file);

    setSubmitting(true);
    const result = await submitReviewAction(formData, productSlug);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    for (const image of newImages) URL.revokeObjectURL(image.preview);
    setNewImages([]);
    setKeptUrls(result.data.imageUrls);
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
        aria-label="Your review"
        placeholder="How does it fit? How's the quality?"
        className="border-input bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:ring-gold/30 mt-5 w-full resize-none border px-4 py-3 text-sm transition-colors outline-none focus:ring-1"
      />

      {/* Photos */}
      <div className="mt-5">
        <div className="flex flex-wrap gap-3">
          {keptUrls.map((url) => (
            <Thumb
              key={url}
              src={url}
              onRemove={() =>
                setKeptUrls((current) => current.filter((u) => u !== url))
              }
            />
          ))}
          {newImages.map((image) => (
            <Thumb
              key={image.id}
              src={image.preview}
              onRemove={() => removeNew(image.id)}
            />
          ))}
          {canAddImage ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="border-input text-muted-foreground hover:border-gold/60 hover:text-foreground flex size-20 flex-col items-center justify-center gap-1 border border-dashed transition-colors"
            >
              <ImagePlus className="size-5" strokeWidth={1.5} />
              <span className="text-[10px] tracking-wide uppercase">Photo</span>
            </button>
          ) : null}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          onChange={onPickFiles}
          className="hidden"
        />
        <p className="text-muted-foreground mt-2 text-[11px]">
          Optional · up to {MAX_REVIEW_IMAGES} photos, shown on this product
          page.
        </p>
      </div>

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

function Thumb({ src, onRemove }: { src: string; onRemove: () => void }) {
  return (
    <div className="bg-secondary relative size-20 overflow-hidden">
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        unoptimized
        sizes="80px"
        className="object-cover"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="bg-background/80 text-foreground hover:bg-background absolute top-1 right-1 flex size-5 items-center justify-center rounded-full transition-colors"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}
