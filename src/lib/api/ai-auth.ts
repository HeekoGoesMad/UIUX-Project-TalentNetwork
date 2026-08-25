import "server-only";

import { getCurrentAppUser, type AppUser } from "@/lib/api/auth";
import type { Database } from "@/db";

export type AllowedAiRole = "candidate" | "recruiter" | "admin" | "partner";

export type AiAuthContext = {
  user: AppUser | null;
  db?: Database;
  isDevBypass: boolean;
};

type AiAuthResult =
  | { success: true; context: AiAuthContext }
  | { success: false; error: string; status: 401 | 403 };

export async function getAiEndpointAuth(options?: {
  allowedRoles?: AllowedAiRole[];
}): Promise<AiAuthResult> {
  const isDevBypass =
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true" ||
    (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production");

  if (isDevBypass) {
    return {
      success: true,
      context: { user: null, isDevBypass: true },
    };
  }

  const current = await getCurrentAppUser();
  if ("error" in current && typeof current.error === "string") {
    return {
      success: false,
      error: current.error,
      status: current.status === 403 ? 403 : 401,
    };
  }

  if (!("user" in current)) {
    return {
      success: false,
      error: "Autentikasi diperlukan.",
      status: 401,
    };
  }

  if (options?.allowedRoles && !options.allowedRoles.includes(current.user.role as AllowedAiRole)) {
    return {
      success: false,
      error: "Peran akun Anda tidak memiliki izin untuk menggunakan fitur AI ini.",
      status: 403,
    };
  }

  return {
    success: true,
    context: {
      user: current.user,
      db: current.db,
      isDevBypass: false,
    },
  };
}
