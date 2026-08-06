import { type Metadata } from "next";

import { ResetPasswordForm } from "@/features/account/components/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-32 sm:px-8">
      <ResetPasswordForm />
    </div>
  );
}
