import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { AdminThemeLock } from "@/components/admin/admin-theme-lock";
import { Toaster } from "@/components/ui/sonner";
import { getAuthUser } from "@/lib/auth/staff";

/**
 * Admin shell. Applies the premium dark theme and mounts the collapsible
 * sidebar, top bar and toaster.
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
    <div className="dark">
      <AdminThemeLock />
      <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
