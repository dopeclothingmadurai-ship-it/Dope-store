import { TestimonialsManager } from "@/features/testimonials";
import { listTestimonials } from "@/features/testimonials/queries";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await listTestimonials();
  return <TestimonialsManager testimonials={testimonials} />;
}
