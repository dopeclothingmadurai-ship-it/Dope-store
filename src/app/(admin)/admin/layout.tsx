import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminThemeLock } from "@/components/admin/admin-theme-lock";
import { Breadcrumbs } from "@/components/admin/breadcrumbs";
import { Toaster } from "@/components/ui/sonner";
import { getAuthUser } from "@/lib/auth/staff";

/**
 * Admin shell. Applies the premium dark theme, mounts the sidebar, the top
 * navigation bar (breadcrumbs) and the Sonner toaster.
 *
 * Staff access is enforced per request by the middleware; this layout re-checks
 * the session as defense in depth and surfaces the signed-in user.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="dark bg-background text-foreground min-h-screen">
      <AdminThemeLock />
      <div className="flex min-h-screen">
        <AdminSidebar userEmail={user.email ?? ""} />
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
