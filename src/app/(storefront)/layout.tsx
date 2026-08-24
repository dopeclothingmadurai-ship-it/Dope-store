import { type ReactNode } from "react";

import { getStoreHomepageContent } from "@/features/homepage";
import { StoreFooter } from "@/features/storefront/components/store-footer";
import { StoreHeader } from "@/features/storefront/components/store-header";

export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Announcement copy is admin-managed; the query never throws (falls back to
  // defaults) so the shell can always render.
  const { announcement } = await getStoreHomepageContent();

  return (
    <div className="storefront bg-background text-foreground font-sans antialiased">
      <StoreHeader announcement={announcement} />
      <main className="min-h-screen">{children}</main>
      <StoreFooter />
    </div>
  );
}
