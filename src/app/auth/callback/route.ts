import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";

function safeNext(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const requestedRole = requestUrl.searchParams.get("role");
  const validRole = requestedRole === "candidate" || requestedRole === "recruiter" || requestedRole === "partner";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Kode+verifikasi+tidak+ditemukan", requestUrl.origin));
  }
  if (requestedRole && !validRole) {
    return NextResponse.redirect(new URL("/login?error=Role+akun+tidak+valid", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user) throw userError ?? new Error("Sesi verifikasi tidak ditemukan.");

    const metadataRole = data.user.user_metadata?.role;
    const result = await syncAuthenticatedUser(data.user, {
      name: typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : undefined,
      companyName: typeof data.user.user_metadata?.companyName === "string" ? data.user.user_metadata.companyName : undefined,
      role: requestedRole === "candidate" || requestedRole === "recruiter" ? requestedRole : undefined,
    });

    const fallback = result.role === "candidate" ? "/candidate/onboarding" : result.provisioningStatus === "active" ? "/dashboard" : "/recruiter/pending";
    const destination = safeNext(next, fallback);
    if (metadataRole !== result.role) {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: result.role },
      });
      if (metadataError) throw metadataError;
    }
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  } catch (error) {
    console.error("Verifikasi email gagal:", error);
    return NextResponse.redirect(new URL("/login?error=Verifikasi+email+gagal", requestUrl.origin));
  }
}
