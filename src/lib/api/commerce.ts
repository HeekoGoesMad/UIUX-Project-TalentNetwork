import "server-only";

import { eq } from "drizzle-orm";
import { getCurrentAppUser } from "@/lib/api/auth";
import { schema, type Database } from "@/db";

export async function requireBillingManager() {
  const current = await getCurrentAppUser();
  if ("error" in current) return current;
  if (current.user.role !== "recruiter") return { error: "Hanya recruiter yang dapat mengakses billing.", status: 403 as const };

  const [membership] = await current.db.select({
    organizationId: schema.organizationMembers.organizationId,
    role: schema.organizationMembers.role,
  }).from(schema.organizationMembers).where(eq(schema.organizationMembers.userId, current.user.id)).limit(1);
  if (!membership) return { error: "Recruiter belum tergabung dalam organisasi.", status: 403 as const };

  const [account] = await current.db.select({ billingOwnerId: schema.billingAccounts.billingOwnerId })
    .from(schema.billingAccounts).where(eq(schema.billingAccounts.organizationId, membership.organizationId)).limit(1);
  const allowed = membership.role === "owner" || membership.role === "admin" || account?.billingOwnerId === current.user.id;
  if (!allowed) return { error: "Hanya billing owner atau organization admin yang dapat mengubah billing.", status: 403 as const };
  return { ...current, membership, billingAccount: account ?? null };
}

export async function getOrCreateBillingAccount(db: Database, organizationId: string, ownerId: string) {
  const [account] = await db.insert(schema.billingAccounts).values({ organizationId, billingOwnerId: ownerId })
    .onConflictDoNothing({ target: schema.billingAccounts.organizationId }).returning();
  if (account) return account;
  const [existing] = await db.select().from(schema.billingAccounts).where(eq(schema.billingAccounts.organizationId, organizationId)).limit(1);
  return existing ?? null;
}

export async function writeAuditLog(db: Database, values: {
  actorUserId?: string | null;
  organizationId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(schema.auditLogs).values({ ...values, metadata: values.metadata ?? {} });
}

export async function requireAdmin() {
  const current = await getCurrentAppUser();
  if ("error" in current) return current;
  if (current.user.role !== "admin") return { error: "Akses admin diperlukan.", status: 403 as const };
  return current;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function databaseError() {
  return { error: "Database tidak tersedia.", status: 503 as const };
}
