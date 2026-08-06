import Image from "next/image";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

import { ReviewForm } from "./review-form";
import { Stars } from "./star-rating";
import {
  type ProductReview,
  type ReviewEligibility,
  type ReviewSummary,
} from "../types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Rating distribution (5★ → 1★) with proportional bars. */
function Distribution({ reviews }: { reviews: ProductReview[] }) {
  const counts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((review) => review.rating === star).length,
  );
  const total = reviews.length || 1;

  return (
    <div className="mt-6 space-y-1.5">
      {[5, 4, 3, 2, 1].map((star, index) => {
        const count = counts[index] ?? 0;
        const pct = Math.round((count / total) * 100);
        return (
          <div key={star} className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground w-3 tabular-nums">
              {star}
            </span>
            <div className="bg-secondary h-1.5 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-gold h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-muted-foreground w-6 text-right tabular-nums">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <figure className="border-border flex flex-col border-t py-8 first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-secondary text-gold flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-medium tracking-wide">
            {initials(review.authorName)}
          </span>
          <div>
            <p className="text-foreground flex items-center gap-1.5 text-sm font-medium">
              {review.authorName}
              <BadgeCheck className="text-gold size-3.5" />
            </p>
            <span className="text-gold/80 text-[10px] font-medium tracking-[0.14em] uppercase">
              Verified purchase
            </span>
          </div>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatDate(review.createdAt)}
        </span>
      </div>

      <div className="mt-4">
        <Stars rating={review.rating} />
      </div>
      <blockquote className="text-foreground/90 mt-3 text-[15px] leading-relaxed">
        {review.body}
      </blockquote>
      {review.imageUrls.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {review.imageUrls.map((url) => (
            <div
              key={url}
              className="bg-secondary relative size-20 overflow-hidden sm:size-24"
            >
              <Image
                src={url}
                alt=""
                aria-hidden
                fill
                unoptimized
                sizes="96px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </figure>
  );
}

export function ProductReviews({
  productId,
  productSlug,
  summary,
  reviews,
  eligibility,
}: {
  productId: string;
  productSlug: string;
  summary: ReviewSummary;
  reviews: ProductReview[];
  eligibility: ReviewEligibility;
}) {
  const nextPath = `/product/${productSlug}`;

  return (
    <section className="border-border mt-28 border-t pt-16 sm:mt-36">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-20">
        {/* Summary + write panel */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-display text-3xl font-light tracking-tight sm:text-4xl">
            Reviews
          </h2>

          {summary.count > 0 ? (
            <>
              <div className="mt-6 flex items-end gap-3">
                <span className="font-display text-5xl leading-none font-light">
                  {summary.average.toFixed(1)}
                </span>
                <div className="pb-1">
                  <Stars rating={summary.average} size="size-4" />
                  <p className="text-muted-foreground mt-1 text-xs">
                    {summary.count} {summary.count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
              <Distribution reviews={reviews} />
            </>
          ) : (
            <p className="text-muted-foreground mt-4 text-sm">
              No reviews yet.
            </p>
          )}

          <div className="mt-8">
            {eligibility.signedIn && eligibility.hasPurchased ? (
              <ReviewForm
                productId={productId}
                productSlug={productSlug}
                existing={eligibility.existing}
              />
            ) : eligibility.signedIn ? (
              <p className="border-border text-muted-foreground border border-dashed px-5 py-6 text-sm leading-relaxed">
                Only verified buyers can review this piece. Once your order for
                it is placed, you can share your thoughts here.
              </p>
            ) : (
              <div className="border-border border border-dashed px-5 py-6">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Purchased this piece?{" "}
                  <Link
                    href={`/account/sign-in?next=${encodeURIComponent(nextPath)}`}
                    className="text-foreground hover:text-gold underline underline-offset-4 transition-colors"
                  >
                    Sign in
                  </Link>{" "}
                  to leave a review.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Review list */}
        <div className={cn(reviews.length === 0 && "hidden lg:block")}>
          {reviews.length > 0 ? (
            <div>
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="border-border flex flex-col items-center border border-dashed px-6 py-20 text-center">
              <p className="text-muted-foreground text-sm">
                No reviews yet — be the first to review this piece.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
