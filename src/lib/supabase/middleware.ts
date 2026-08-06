import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { clientEnv } from "@/lib/env/client";
import { type Database } from "@/types/database";

/** Build a redirect that carries the refreshed auth cookies. */
function redirectWithCookies(
  request: NextRequest,
  source: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    url.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(url);
  for (const cookie of source.cookies.getAll()) {
    response.cookies.set(cookie);
  }
  return response;
}

/**
 * Refreshes the Supabase auth session on every matched request and gates the
 * `/admin` area: unauthenticated users are sent to `/login`, and authenticated
 * non-staff users are rejected. This is the per-request guard; the admin layout
 * and each admin Server Action re-check as defense in depth.
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return redirectWithCookies(request, supabaseResponse, "/login", {
        next: pathname,
      });
    }
    const { data: staff } = await supabase.rpc("is_staff");
    if (staff !== true) {
      return redirectWithCookies(request, supabaseResponse, "/login", {
        error: "unauthorized",
      });
    }
  }

  // Gate the customer account area (the sign-in/register pages stay public).
  // The page-level getCustomer() guard remains as defense in depth, but this
  // issues a real 307 before rendering rather than a soft client redirect.
  const isPublicAccountRoute =
    pathname.startsWith("/account/sign-in") ||
    pathname.startsWith("/account/register") ||
    pathname.startsWith("/account/forgot-password") ||
    pathname.startsWith("/account/reset-password");
  if (
    pathname === "/account" ||
    (pathname.startsWith("/account/") && !isPublicAccountRoute)
  ) {
    if (!user) {
      return redirectWithCookies(
        request,
        supabaseResponse,
        "/account/sign-in",
        { next: pathname },
      );
    }
  }

  return supabaseResponse;
}
