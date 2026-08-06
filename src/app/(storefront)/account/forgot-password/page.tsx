import { type Metadata } from "next";

import { ForgotPasswordForm } from "@/features/account/components/forgot-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-32 sm:px-8">
      <ForgotPasswordForm />
    </div>
  );
}
