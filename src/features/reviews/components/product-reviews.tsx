import Image from "next/image";
import Link from "next/link";

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

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <figure className="border-border flex flex-col border-t py-8 first:border-t-0">
      <div className="flex items-center justify-between gap-4">
        <Stars rating={review.rating} />
        <span className="text-muted-foreground text-xs">
          {formatDate(review.createdAt)}
        </span>
      </div>
      <blockquote className="text-foreground/90 mt-4 text-[15px] leading-relaxed">
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
      <figcaption className="text-muted-foreground mt-5 text-[12px] font-medium tracking-[0.16em] uppercase">
        {review.authorName}
      </figcaption>
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
            <div className="mt-5 flex items-center gap-3">
              <Stars rating={summary.average} size="size-4" />
              <span className="text-foreground text-sm">
                {summary.average.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm">
                · {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </span>
            </div>
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
            <p className="text-muted-foreground text-sm">
              Be the first to review this piece.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
