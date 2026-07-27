import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env/client";
import { type Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session on every matched request and keeps the
 * session cookies in sync between the request and the response.
 *
 * This only maintains the session. Route protection (e.g. gating `/admin`) is
 * layered on top in a later phase — the session must be fresh first.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: do not run any code between creating the client and calling
  // `getUser()`. A subtle bug here can randomly sign users out, because the
  // refreshed token would not be written back to the response cookies.
  await supabase.auth.getUser();

  return supabaseResponse;
}
