import "server-only";

import { eq } from "drizzle-orm";

import { getDb, schema, type Database } from "@/db";
import { createClient } from "@/lib/supabase/server";

export type AppUser = typeof schema.users.$inferSelect;

function recruiterAccessError(status: AppUser["recruiterProvisioningStatus"]) {
  if (status === "active") return { error: "Akun recruiter belum dapat mengakses data ini.", status: 403 as const };
  return {
    error: status === "rejected"
      ? "Akun recruiter ditolak oleh organisasi."
      : "Akun recruiter masih menunggu persetujuan organisasi.",
    status: 403 as const,
  };
}

export async function getCurrentAppUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "Autentikasi diperlukan.", status: 401 as const };

  const db = getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.authUserId, data.user.id)).limit(1);
  if (!user) return { error: "Profil pengguna tidak ditemukan.", status: 403 as const };
  if (user.role === "recruiter" && user.recruiterProvisioningStatus !== "active") {
    return recruiterAccessError(user.recruiterProvisioningStatus);
  }

  return { user, db, authUser: data.user };
}

export async function getRecruiterScope(db: Database, user: AppUser) {
  if (user.role !== "recruiter") return { error: "Hanya recruiter yang dapat mengakses data ini.", status: 403 as const };
  if (user.recruiterProvisioningStatus !== "active") return recruiterAccessError(user.recruiterProvisioningStatus);

  const [membership] = await db.select({
    organizationId: schema.organizationMembers.organizationId,
    organizationRole: schema.organizationMembers.role,
  })
    .from(schema.organizationMembers)
    .where(eq(schema.organizationMembers.userId, user.id))
    .limit(1);

  if (!membership) return { error: "Recruiter belum tergabung dalam organisasi.", status: 403 as const };
  return { membership };
}

export async function getRecruiterTokenAccount(db: Database, organizationId: string) {
  const [account] = await db.select({
    id: schema.tokenAccounts.id,
    balance: schema.tokenAccounts.balance,
    updatedAt: schema.tokenAccounts.updatedAt,
  }).from(schema.tokenAccounts)
    .where(eq(schema.tokenAccounts.organizationId, organizationId))
    .limit(1);

  return {
    accountId: account?.id ?? null,
    balance: account?.balance ?? 0,
    updatedAt: account?.updatedAt ?? null,
  };
}
