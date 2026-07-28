"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AuthError, runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { createClient } from "@/lib/supabase/server";

import { loginSchema } from "./schema";

/**
 * Sign in with email/password. Only staff accounts are allowed — a valid but
 * non-staff account is signed straight back out. Returns a Result so the form
 * can show errors; the client redirects on success.
 */
export async function signInAction(input: unknown): Promise<Result<null>> {
  return runAction(async () => {
    const { email, password } = loginSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new AuthError("Invalid email or password.");

    const { data: staff } = await supabase.rpc("is_staff");
    if (staff !== true) {
      await supabase.auth.signOut();
      throw new AuthError("This account is not authorized for the admin.");
    }

    revalidatePath("/admin", "layout");
    return null;
  });
}

/** Sign out and return to the login page. */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
