import { ContentManager } from "@/features/homepage/components/content-manager";
import { getHomepageContentRowForAdmin } from "@/features/homepage";
import { countPendingTestimonials } from "@/features/testimonials";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const [content, pendingTestimonials] = await Promise.all([
    getHomepageContentRowForAdmin(),
    countPendingTestimonials(),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          Homepage
        </h1>
        <p className="text-muted-foreground text-sm">
          Edit the hero, promotional banner, announcement marquee and
          testimonials — changes go live immediately.
        </p>
      </div>

      <ContentManager
        content={content}
        pendingTestimonials={pendingTestimonials}
      />
    </div>
  );
}
