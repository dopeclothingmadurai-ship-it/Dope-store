import { type ReactNode } from "react";

import { StoreFooter } from "@/features/storefront/components/store-footer";
import { StoreHeader } from "@/features/storefront/components/store-header";

export default function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="storefront bg-background text-foreground font-sans antialiased">
      <StoreHeader />
      <main className="min-h-screen">{children}</main>
      <StoreFooter />
    </div>
  );
}
