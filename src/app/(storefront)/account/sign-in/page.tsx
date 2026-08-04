import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthPanel } from "@/features/account";
import { getCustomer } from "@/lib/auth/customer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  if (await getCustomer()) redirect(next ?? "/account");

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-32 sm:px-8">
      <AuthPanel mode="sign-in" next={next ?? null} />
    </div>
  );
}
