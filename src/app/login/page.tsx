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
    <div className="dark bg-background text-foreground flex min-h-screen items-center justify-center p-4">
      <AdminThemeLock />
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
