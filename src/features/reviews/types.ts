/** A published product review as shown on the product detail page. */
export type ProductReview = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  imageUrls: string[];
  createdAt: string;
};

/** Aggregate rating for a product's published reviews. */
export type ReviewSummary = {
  count: number;
  average: number;
};

/**
 * What the current viewer may do on a product's review section.
 *   signedIn     — a customer is signed in
 *   hasPurchased — that customer has an order containing this product
 *   existing     — their existing review, if any (enables edit mode)
 */
export type ReviewEligibility = {
  signedIn: boolean;
  hasPurchased: boolean;
  existing: ProductReview | null;
};
