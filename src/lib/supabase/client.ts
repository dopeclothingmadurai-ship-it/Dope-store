import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env/client";
import { type Database } from "@/types/database";

/**
 * Browser Supabase client (RLS-scoped as the signed-in user).
 *
 * Use only inside Client Components — for realtime and optimistic UI. All
 * privileged reads/writes go through Server Actions and the server client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
