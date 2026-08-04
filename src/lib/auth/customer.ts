import "server-only";

import { type User } from "@supabase/supabase-js";

import { AuthError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

/**
 * A signed-in storefront customer. Customers share Supabase Auth with staff —
 * the distinction is simply that a customer is an authenticated user who is
 * *not* staff. Their email is the join key to the CRM `customers` row and to
 * their order history (`orders.customer_email` / `orders.customer_id`).
 */
export type CustomerSession = {
  user: User;
  email: string;
  name: string;
};

/** Derive a friendly display name from the account metadata or email. */
function displayName(user: User): string {
  const meta = (user.user_metadata?.name as string | undefined)?.trim();
  if (meta) return meta;
  return user.email?.split("@")[0] ?? "there";
}

/**
 * The current signed-in customer, or null. Staff accounts return null here —
 * they belong in the admin, not the storefront account area.
 */
export async function getCustomer(): Promise<CustomerSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: staff } = await supabase.rpc("is_staff");
  if (staff === true) return null;

  return {
    user,
    email: user.email.toLowerCase(),
    name: displayName(user),
  };
}

/** Guard for customer-only flows: throws AuthError unless a customer is signed in. */
export async function requireCustomer(): Promise<CustomerSession> {
  const customer = await getCustomer();
  if (!customer) throw new AuthError("Please sign in to continue.");
  return customer;
}
