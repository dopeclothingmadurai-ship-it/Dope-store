"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AppError, AuthError, ConflictError, runAction } from "@/lib/errors";
import { type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { customerLoginSchema, customerRegisterSchema } from "./schema";

/**
 * Register a customer and sign them in. The account is created pre-confirmed
 * via the service-role client, so registration works without transactional
 * email set up (a small store can add verification later). Staff accounts are
 * created separately in Supabase — this path is customers only.
 */
export async function registerCustomerAction(
  input: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const { name, email, password } = customerRegisterSchema.parse(input);
    const normalizedEmail = email.toLowerCase();

    const admin = createAdminClient();
    const { error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });
    if (createError) {
      const message = createError.message.toLowerCase();
      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        throw new ConflictError(
          "An account with this email already exists. Try signing in.",
        );
      }
      throw new AppError(
        "auth_error",
        "Could not create your account. Please try again.",
      );
    }

    // Establish the session cookie on the RLS-scoped storefront client.
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (signInError) {
      throw new AuthError(
        "Your account was created — please sign in to continue.",
      );
    }

    revalidatePath("/", "layout");
    return null;
  });
}

/**
 * Sign in an existing customer. Staff accounts are rejected here and signed
 * back out — they use the admin sign-in at /login.
 */
export async function signInCustomerAction(
  input: unknown,
): Promise<Result<null>> {
  return runAction(async () => {
    const { email, password } = customerLoginSchema.parse(input);
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    if (error) throw new AuthError("Invalid email or password.");

    const { data: staff } = await supabase.rpc("is_staff");
    if (staff === true) {
      await supabase.auth.signOut();
      throw new AuthError(
        "That's a staff account — please use the admin sign-in.",
      );
    }

    revalidatePath("/", "layout");
    return null;
  });
}

/** Sign out and return to the storefront home. */
export async function signOutCustomerAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
