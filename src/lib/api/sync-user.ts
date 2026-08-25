import "server-only";

import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDb, schema } from "@/db";
import { ShortlistService } from "@/lib/services/shortlist";

export async function syncAuthenticatedUser(authUser: User, input: { name?: string; companyName?: string }) {
  if (!authUser.email) throw new Error("AUTH_EMAIL_MISSING");
  const authEmail = authUser.email;

  const db = getDb();
  return db.transaction(async (tx) => {
    const [existingByAuthId] = await tx.select({
      id: schema.users.id,
      role: schema.users.role,
      recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
    }).from(schema.users).where(eq(schema.users.authUserId, authUser.id)).limit(1);
    const [existingByEmail] = existingByAuthId ? [] : await tx.select({
      id: schema.users.id,
      role: schema.users.role,
      recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
    }).from(schema.users).where(eq(schema.users.email, authEmail)).limit(1);
    const existing = existingByAuthId ?? existingByEmail;

    const metadataRole = authUser.user_metadata?.role;
    const role = existing?.role ?? (metadataRole === "candidate" || metadataRole === "recruiter" ? metadataRole : null);
    if (!role) throw new Error("ROLE_UNVERIFIED");

    const [user] = existing
      ? await tx.update(schema.users).set({ authUserId: authUser.id, email: authEmail, updatedAt: new Date() }).where(eq(schema.users.id, existing.id)).returning({ id: schema.users.id, role: schema.users.role, recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus })
      : await tx.insert(schema.users).values({ authUserId: authUser.id, email: authEmail, role, recruiterProvisioningStatus: role === "candidate" ? "active" : "pending" }).returning({ id: schema.users.id, role: schema.users.role, recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus });

    await tx.insert(schema.profiles).values({
      userId: user.id,
      displayName: input.name?.trim() || (typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : authEmail.split("@")[0]),
    }).onConflictDoUpdate({
      target: schema.profiles.userId,
      set: { displayName: input.name?.trim() || undefined, updatedAt: new Date() },
    });

    if (role === "recruiter" && user.recruiterProvisioningStatus === "active") {
      const membership = await tx.select({ organizationId: schema.organizationMembers.organizationId })
        .from(schema.organizationMembers).where(eq(schema.organizationMembers.userId, user.id)).limit(1);
      let organizationId = membership[0]?.organizationId;
      if (membership.length === 0) {
        const slug = `org-${authUser.id}`;
        const [organization] = await tx.insert(schema.organizations).values({
          name: input.companyName?.trim() || `${input.name?.trim() || authEmail.split("@")[0]} Recruiter`,
          slug,
          createdBy: user.id,
        }).onConflictDoUpdate({
          target: schema.organizations.slug,
          set: { updatedAt: new Date() },
        }).returning({ id: schema.organizations.id });
        organizationId = organization.id;
        await tx.insert(schema.organizationMembers).values({ organizationId: organization.id, userId: user.id, role: "owner" }).onConflictDoNothing();
        await tx.insert(schema.tokenAccounts).values({ organizationId: organization.id }).onConflictDoNothing();
      }
      if (organizationId) await ShortlistService.ensureDefault(tx, organizationId, user.id);
    }

    return { userId: user.id, role: user.role, provisioningStatus: user.recruiterProvisioningStatus };
  });
}
