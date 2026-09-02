import "server-only";

import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDb, schema } from "@/db";
import { ShortlistService } from "@/lib/services/shortlist";

type PersistedRole = "candidate" | "recruiter" | "partner" | "admin";

export async function syncAuthenticatedUser(authUser: User, input: { name?: string; companyName?: string; role?: PersistedRole }) {
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

    const metadataRole = authUser.user_metadata?.role as PersistedRole | undefined;
    const requestedRole: PersistedRole | undefined = input.role ?? metadataRole;

    // Strict 1 Email = 1 Role check:
    // If the user already exists in the database with an assigned role, do NOT allow changing roles.
    if (existing && requestedRole && existing.role !== requestedRole) {
      const err = new Error(`ROLE_MISMATCH:${existing.role}:${requestedRole}`);
      err.name = "RoleMismatchError";
      throw err;
    }

    const role: PersistedRole = existing?.role ?? requestedRole ?? "candidate";

    const [user] = existing
      ? await tx.update(schema.users).set({
          authUserId: authUser.id,
          email: authEmail,
          role: existing.role, // Never mutate an existing account's role
          recruiterProvisioningStatus: existing.role === "recruiter" ? (existing.recruiterProvisioningStatus ?? "pending") : "active",
          updatedAt: new Date(),
        }).where(eq(schema.users.id, existing.id)).returning({ id: schema.users.id, role: schema.users.role, recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus })
      : await tx.insert(schema.users).values({
          authUserId: authUser.id,
          email: authEmail,
          role,
          recruiterProvisioningStatus: role === "candidate" || role === "partner" ? "active" : "pending",
        }).returning({ id: schema.users.id, role: schema.users.role, recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus });

    // Ensure displayName is NOT overwritten with an email prefix if an existing profile already has a name
    const [existingProfile] = await tx.select({
      displayName: schema.profiles.displayName,
    }).from(schema.profiles).where(eq(schema.profiles.userId, user.id)).limit(1);

    const providedName = input.name?.trim();
    const isDefaultFallback = !providedName || providedName === authEmail.split("@")[0];
    const resolvedName = existingProfile?.displayName?.trim()
      ? (isDefaultFallback ? existingProfile.displayName : providedName)
      : (providedName || (typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : authEmail.split("@")[0]));

    await tx.insert(schema.profiles).values({
      userId: user.id,
      displayName: resolvedName,
    }).onConflictDoUpdate({
      target: schema.profiles.userId,
      set: {
        displayName: resolvedName,
        updatedAt: new Date(),
      },
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
