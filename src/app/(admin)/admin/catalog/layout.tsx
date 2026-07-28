import { type ReactNode } from "react";

import { CatalogTabs } from "@/components/admin/catalog-tabs";

export default function CatalogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <CatalogTabs />
      <div>{children}</div>
    </div>
  );
}
