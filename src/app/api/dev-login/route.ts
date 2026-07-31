import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { type Database } from "@/types/database";

/**
 * DEVELOPMENT-ONLY owner auto-login.
 *
 * Lets browser automation obtain a real owner session in a single GET, without
 * typing credentials and without hardcoding any password. It mints a one-time
 * Supabase magic-link token with the service role and immediately verifies it,
 * writing the normal auth cookies onto the redirect to `/admin`. From there,
 * every existing guard (middleware, layout, server actions, RLS/is_staff) runs
 * exactly as it would for a hand-typed login — nothing is bypassed.
 *
 * Hard-disabled in production:
 *   - returns 404 whenever NODE_ENV === "production";
 *   - returns 404 unless the DEV_LOGIN_SECRET env var is set AND matches the
 *     `secret` query parameter.
 * With the secret unset (the default), the route is inert even in development.
 *
 * To remove entirely: delete this file. To disable: unset DEV_LOGIN_SECRET.
 */

const DEFAULT_OWNER_EMAIL = "dopeclothingmadurai@gmail.com";

function notFound(): NextResponse {
  return new NextResponse("Not found", { status: 404 });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Never in production — no matter what.
  if (process.env.NODE_ENV === "production") return notFound();

  // 2. Require a server-side secret that matches the request. If the secret is
  //    not configured, the helper stays completely inert.
  const secret = process.env.DEV_LOGIN_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  if (!secret || provided !== secret) return notFound();

  const email = process.env.DEV_LOGIN_EMAIL?.trim() || DEFAULT_OWNER_EMAIL;

  // 3. Mint a one-time magic-link token for the owner (no password involved).
  const admin = createAdminClient();
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) {
    return new NextResponse(
      `dev-login: could not generate a session for ${email}`,
      { status: 500 },
    );
  }

  // 4. Verify the token with an SSR client whose cookie writes land on the
  //    redirect response — the same mechanism a normal sign-in uses.
  const response = NextResponse.redirect(new URL("/admin", request.url));
  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  if (verifyError) {
    return new NextResponse(`dev-login: ${verifyError.message}`, {
      status: 500,
    });
  }

  return response;
}
