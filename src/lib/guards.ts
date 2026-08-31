import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAppUser, type AppUser } from "@/lib/api/auth";

export type Role = AppUser["role"];

const ROLE_HOME: Record<Role, string> = {
  candidate: "/candidate",
  recruiter: "/dashboard",
  partner: "/partner",
  admin: "/dashboard",
};

type Resolution =
  | { kind: "user"; user: AppUser }
  | { kind: "unauthenticated" }
  | { kind: "provisioning" }
  | { kind: "unavailable" }
  | { kind: "demo" };

async function resolveAccess(): Promise<Resolution> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { kind: "demo" };
  }
  try {
    const res = await getCurrentAppUser({ allowPending: true });
    if (!("error" in res)) {
      if (res.user.role === "recruiter" && res.user.recruiterProvisioningStatus !== "active") {
        return { kind: "provisioning" };
      }
      return { kind: "user", user: res.user };
    }
    if ("reason" in res) return { kind: "provisioning" };
    return { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

export type GuardResult = { ok: true } | { ok: false };

export async function requireAppUser(): Promise<GuardResult> {
  const res = await resolveAccess();
  if (res.kind === "unauthenticated") redirect("/login");
  if (res.kind === "unavailable") return { ok: false };
  return { ok: true };
}

export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const res = await resolveAccess();
  if (res.kind === "demo") return { ok: true };
  if (res.kind === "unauthenticated") redirect("/login");
  if (res.kind === "unavailable") return { ok: false };
  if (res.kind === "provisioning") redirect("/recruiter/pending");
  if (!roles.includes(res.user.role)) redirect(ROLE_HOME[res.user.role]);
  return { ok: true };
}
