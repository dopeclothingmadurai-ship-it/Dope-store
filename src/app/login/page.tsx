import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminThemeLock } from "@/components/admin/admin-theme-lock";
import { LoginForm } from "@/features/auth/components/login-form";
import { isCurrentUserStaff } from "@/lib/auth/staff";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isCurrentUserStaff()) {
    redirect("/admin/catalog/products");
  }

  return (
    <div className="dark bg-background text-foreground relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <AdminThemeLock />

      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.05] blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.5))]" />
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
