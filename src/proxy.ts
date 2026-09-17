import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  requestHeaders.set("x-pathname", target);

  const initialResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const response = await updateSession(request, initialResponse);
  response.headers.set("X-Request-Id", crypto.randomUUID());
  return response;
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
