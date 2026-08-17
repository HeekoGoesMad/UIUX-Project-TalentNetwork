import "server-only";

import { NextResponse } from "next/server";

import { getCurrentAppUser, type AppUser } from "@/lib/api/auth";

export type ApiRole = "candidate" | "recruiter";
export type ApiAccess =
  | { mode: "demo"; role: ApiRole }
  | { mode: "database"; role: ApiRole; user: AppUser };
export type ApiAccessFailure = { error: string; status: 401 | 403 | 503 };

function demoAuthEnabled() {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
}

function databaseModeConfigured() {
  return Boolean(
    process.env.DATABASE_URL ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export async function requireApiAccess(role: ApiRole): Promise<ApiAccess | ApiAccessFailure> {
  if (demoAuthEnabled()) return { mode: "demo", role };
  if (!databaseModeConfigured()) {
    return { error: "Autentikasi API belum dikonfigurasi.", status: 503 };
  }

  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      const status = current.status === 401 || current.status === 403 ? current.status : 503;
      return { error: current.error ?? "Autentikasi diperlukan.", status };
    }
    if (current.user.role !== role) {
      return {
        error: role === "candidate" ? "Hanya kandidat yang dapat mengakses fitur ini." : "Hanya recruiter yang dapat mengakses fitur ini.",
        status: 403,
      };
    }
    return { mode: "database", role, user: current.user };
  } catch (error) {
    console.error("API authorization lookup failed", error);
    return { error: "Layanan autentikasi belum tersedia.", status: 503 };
  }
}

export function accessResponse(access: ApiAccessFailure) {
  return NextResponse.json({ error: access.error }, { status: access.status });
}

export function withAccessMode(response: NextResponse, access: ApiAccess) {
  response.headers.set("X-Proofylink-Auth-Mode", access.mode);
  return response;
}

export function isApiAccess(value: ApiAccess | ApiAccessFailure): value is ApiAccess {
  return "mode" in value;
}
