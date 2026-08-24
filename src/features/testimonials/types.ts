import { type Tables } from "@/types/database";

export type Testimonial = Tables<"testimonials">;

/** The trimmed shape the storefront renders (never exposes internal columns). */
export type StoreTestimonial = {
  id: string;
  customerName: string;
  review: string;
  rating: number;
  location: string | null;
  avatarUrl: string | null;
  verifiedPurchase: boolean;
};

export type {
  TestimonialFormValues,
  TestimonialStatus,
  CustomerTestimonialValues,
} from "./schema";
