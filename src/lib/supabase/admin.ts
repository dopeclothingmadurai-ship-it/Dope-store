import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { clientEnv } from "@/lib/env/client";
import { serverEnv } from "@/lib/env/server";
import { type Database } from "@/types/database";

/**
 * Privileged Supabase client using the service-role key. **Bypasses RLS.**
 *
 * The `server-only` import above makes any attempt to import this module into a
 * Client Component a hard build error — the service-role key must never reach
 * the browser.
 *
 * Use sparingly and only for trusted server-side flows that RLS cannot express
 * (e.g. Razorpay webhook processing). Prefer the RLS-scoped server client for
 * everything else.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
