import { type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeLock } from "@/components/admin/admin-theme-lock";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { Toaster } from "@/components/ui/sonner";

/**
 * Admin shell. Applies the premium dark theme, mounts the sidebar, the top
 * navigation bar (breadcrumbs) and the Sonner toaster. Route protection is
 * added in Phase 3.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <AdminThemeLock />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="bg-background/80 sticky top-0 z-20 flex h-12 shrink-0 items-center border-b px-4 backdrop-blur sm:px-6 lg:px-8">
            <Breadcrumbs />
          </header>
          <div className="flex-1">{children}</div>
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
