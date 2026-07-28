import { type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeLock } from "@/components/admin/admin-theme-lock";
import { Toaster } from "@/components/ui/sonner";

/**
 * Admin shell. Applies the premium dark theme, mounts the sidebar and the
 * Sonner toaster. Route protection is added in Phase 3.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <AdminThemeLock />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
