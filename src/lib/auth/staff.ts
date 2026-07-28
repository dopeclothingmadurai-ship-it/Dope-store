import "server-only";

import { type User } from "@supabase/supabase-js";

import { AuthError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/** The current signed-in user, or null. */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Whether the current session belongs to a staff member (via is_staff()). */
export async function isCurrentUserStaff(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_staff");
  return !error && data === true;
}

/**
 * Guard for Server Actions: throws AuthError unless the caller is signed-in
 * staff. The action's `runStaffAction` wrapper converts it into a Result error.
 */
export async function requireStaff(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("You must be signed in.");

  const { data: staff, error } = await supabase.rpc("is_staff");
  if (error || staff !== true) {
    throw new AuthError("You are not authorized to do that.");
  }
  return user;
}
