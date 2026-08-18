import "server-only";

import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

export async function currentUserOrError() {
  return getCurrentAppUser();
}

export type BillingScope = { db: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>["db"]>; user: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>["user"]>; organizationId: string | null; organizationRole: string };
export async function billingScope(current: Awaited<ReturnType<typeof getCurrentAppUser>>): Promise<BillingScope | { error: string; status: 401 | 403 }> {
  if (!("user" in current) || !current.user || !current.db) return { error: "Autentikasi diperlukan.", status: 401 as const };
  const user = current.user;
  const db = current.db;
  if (user.role === "admin") return { db, user, organizationId: null as string | null, organizationRole: "admin" as const };
  const scope = await getRecruiterScope(db, user);
  if ("error" in scope) return scope;
  return { db, user, organizationId: scope.membership.organizationId, organizationRole: scope.membership.organizationRole };
}

export function canManageBilling(role: string) { return role === "owner" || role === "admin"; }

export async function organizationForUser(current: Awaited<ReturnType<typeof getCurrentAppUser>>) {
  if (!("user" in current) || !current.user || !current.db) return { error: "Autentikasi diperlukan.", status: 401 as const };
  const membership = await current.db.select({ organizationId: schema.organizationMembers.organizationId, role: schema.organizationMembers.role })
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.userId, current.user.id)).limit(1);
  if (!membership[0]) return { error: "Organisasi recruiter belum tersedia.", status: 403 as const };
  return { ...current, organizationId: membership[0].organizationId, organizationRole: membership[0].role };
}
