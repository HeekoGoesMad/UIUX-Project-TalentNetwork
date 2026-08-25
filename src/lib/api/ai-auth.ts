import "server-only";

import { getCurrentAppUser, type AppUser } from "@/lib/api/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";
import type { Database } from "@/db";

export type AllowedAiRole = "candidate" | "recruiter" | "admin" | "partner";

export type AiAuthContext = {
  user: AppUser | null;
  db?: Database;
  isDevBypass: boolean;
};

type AiAuthResult =
  | { success: true; context: AiAuthContext }
  | { success: false; error: string; status: 401 | 403 | 429 };

function finishAiAuth(context: AiAuthContext): AiAuthResult {
  const { allowed } = enforceRateLimit(
    `ai:${context.user?.id ?? "dev-bypass"}`,
    RATE_LIMITS.ai.limit,
    RATE_LIMITS.ai.windowMs
  );
  if (!allowed) {
    return {
      success: false,
      error: "Terlalu banyak permintaan fitur AI. Coba lagi sebentar.",
      status: 429,
    };
  }
  const daily = enforceRateLimit(
    `ai-daily:${context.user?.id ?? "dev"}`,
    RATE_LIMITS.aiDaily.limit,
    RATE_LIMITS.aiDaily.windowMs
  );
  if (!daily.allowed) {
    return {
      success: false,
      error: "Kuota harian fitur AI sudah habis. Coba lagi besok.",
      status: 429,
    };
  }
  return { success: true, context };
}

export async function getAiEndpointAuth(options?: {
  allowedRoles?: AllowedAiRole[];
}): Promise<AiAuthResult> {
  if (process.env.NODE_ENV === "production" && process.env.DEV_AUTH_BYPASS) {
    throw new Error("DEV_AUTH_BYPASS must not be set in production");
  }
  const isDevBypass =
    process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "true";

  if (isDevBypass) {
    return finishAiAuth({ user: null, isDevBypass: true });
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

  return finishAiAuth({
    user: current.user,
    db: current.db,
    isDevBypass: false,
  });
}
