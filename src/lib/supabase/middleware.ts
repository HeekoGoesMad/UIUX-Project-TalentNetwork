import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return response;

  const pathname = request.nextUrl.pathname;

  // Skip updateSession for API and auth callback routes:
  // API route handlers authenticate directly and manage their own responses.
  // Running remote getUser() in middleware on /api/* duplicates external HTTPS auth roundtrips.
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/callback")) {
    return response;
  }

  // If the user has no Supabase auth cookies, skip the external HTTPS network call
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") || c.name.includes("auth-token"));

  if (!hasAuthCookie) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

