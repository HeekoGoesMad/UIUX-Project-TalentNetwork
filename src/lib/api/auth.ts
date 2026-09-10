import "server-only";

import { eq } from "drizzle-orm";

import { NextRequest, NextResponse } from "next/server";

import { getDb, schema, type Database } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";

export type AppUser = typeof schema.users.$inferSelect;

function recruiterAccessError(status: AppUser["recruiterProvisioningStatus"]) {
  if (status === "active") return { error: "Akun recruiter belum dapat mengakses data ini.", status: 403 as const };
  return {
    error: status === "rejected"
      ? "Akun recruiter ditolak oleh organisasi."
      : "Akun recruiter masih menunggu persetujuan organisasi.",
    status: 403 as const,
    reason: status === "rejected" ? ("recruiter-rejected" as const) : ("recruiter-pending" as const),
  };
}

export async function getCurrentAppUser(options?: { allowPending?: boolean }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "Autentikasi diperlukan.", status: 401 as const };

  const db = getDb();
  let [user] = await db.select().from(schema.users).where(eq(schema.users.authUserId, data.user.id)).limit(1);

  if (!user && data.user.email) {
    const [byEmail] = await db.select().from(schema.users).where(eq(schema.users.email, data.user.email)).limit(1);
    if (byEmail) {
      await db.update(schema.users).set({ authUserId: data.user.id, updatedAt: new Date() }).where(eq(schema.users.id, byEmail.id));
      user = byEmail;
    } else {
      try {
        const metadataRole = data.user.user_metadata?.role;
        const resolvedRole = metadataRole === "candidate" || metadataRole === "recruiter" || metadataRole === "partner" ? metadataRole : "candidate";
        const synced = await syncAuthenticatedUser(data.user, {
          name: typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : data.user.email.split("@")[0],
          role: resolvedRole,
        });
        const [created] = await db.select().from(schema.users).where(eq(schema.users.id, synced.userId)).limit(1);
        user = created;
      } catch {
        // ignore
      }
    }
  }

  if (!user) return { error: "Profil pengguna tidak ditemukan.", status: 403 as const };
  if (!options?.allowPending && user.role === "recruiter" && user.recruiterProvisioningStatus !== "active") {
    return recruiterAccessError(user.recruiterProvisioningStatus);
  }

  return { user, db, authUser: data.user };
}

export async function requireRoles(
  roles?: Array<AppUser["role"]>,
  options?: { allowPending?: boolean; forbiddenError?: string },
) {
  const current = await getCurrentAppUser({ allowPending: options?.allowPending });
  if ("error" in current) return current;
  if (roles && !roles.includes(current.user.role)) {
    return { error: options?.forbiddenError ?? "Akses ditolak untuk peran ini.", status: 403 as const };
  }
  return { user: current.user, db: current.db, authUser: current.authUser };
}

export type AuthContext = Extract<Awaited<ReturnType<typeof requireRoles>>, { user: AppUser }>;

export async function requireAdmin() {
  return requireRoles(["admin"], { allowPending: true, forbiddenError: "Akses admin diperlukan." });
}

// Cookbook: 1.GET=withAuth(async({user,db})=>{...}) 2.roles:{roles:["recruiter"]}
// 3.pending:{allowPending:true}(default blocks) 4.401/403 JSON automatic,drop manual checks
// 5.params:extra args forwarded (auth,req,...args) 6.admin:{roles:["admin"],allowPending:true}
// 7.AI keeps getAiEndpointAuth(rate-limit+bypass) 8.layouts keep guards requireRole(redirect)
// 9.do NOT mass-migrate ~55 routes; adopt per-route on touch.
export function withAuth(
  handler: (auth: AuthContext, req: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse,
  opts?: { roles?: Array<AppUser["role"]>; allowPending?: boolean; forbiddenError?: string },
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const current = await requireRoles(opts?.roles, { allowPending: opts?.allowPending, forbiddenError: opts?.forbiddenError });
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    return handler(current, req, ...args);
  };
}

export type RecruiterMembership = {
  organizationId: string;
  organizationRole: (typeof schema.organizationMembers.$inferSelect)["role"];
};

export async function getRecruiterScope(
  db: Database,
  user: AppUser
): Promise<{ membership: RecruiterMembership } | { error: string; status: 403 }> {
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
