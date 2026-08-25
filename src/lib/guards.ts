import "server-only";

import { redirect } from "next/navigation";

import { getCurrentAppUser, type AppUser } from "@/lib/api/auth";

export type Role = AppUser["role"];

const ROLE_HOME: Record<Role, string> = {
  candidate: "/candidate",
  recruiter: "/dashboard",
  admin: "/dashboard",
};

type Resolution =
  | { kind: "user"; user: AppUser }
  | { kind: "unauthenticated" }
  | { kind: "recruiter-pending" };

async function resolveAccess(): Promise<Resolution> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { kind: "unauthenticated" };
  try {
    const res = await getCurrentAppUser();
    if (!("error" in res)) return { kind: "user", user: res.user };
    if ("reason" in res && res.reason === "recruiter-pending") return { kind: "recruiter-pending" };
    return { kind: "unauthenticated" };
  } catch {
    return { kind: "unauthenticated" };
  }
}

export async function requireAppUser(): Promise<AppUser> {
  const res = await resolveAccess();
  if (res.kind !== "user") redirect("/login");
  return res.user;
}

export async function requireRole(roles: Role[]): Promise<AppUser> {
  const res = await resolveAccess();
  if (res.kind === "recruiter-pending") redirect("/recruiter/pending");
  if (res.kind !== "user") redirect("/login");
  if (!roles.includes(res.user.role)) redirect(ROLE_HOME[res.user.role]);
  return res.user;
}
