import "server-only";

import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { getDb, schema } from "@/db";
import { ShortlistService } from "@/lib/services/shortlist";

type PersistedRole = "candidate" | "recruiter" | "partner" | "admin";

export async function syncAuthenticatedUser(
  authUser: User,
  input: { name?: string; companyName?: string; role?: PersistedRole; hasPassword?: boolean }
) {
  if (!authUser.email) throw new Error("AUTH_EMAIL_MISSING");
  const authEmail = authUser.email;

  const db = getDb();
  return db.transaction(async (tx) => {
    const [existingByAuthId] = await tx.select({
      id: schema.users.id,
      role: schema.users.role,
      recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
      hasPassword: schema.users.hasPassword,
    }).from(schema.users).where(eq(schema.users.authUserId, authUser.id)).limit(1);
    const [existingByEmail] = existingByAuthId ? [] : await tx.select({
      id: schema.users.id,
      role: schema.users.role,
      recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
      hasPassword: schema.users.hasPassword,
    }).from(schema.users).where(eq(schema.users.email, authEmail)).limit(1);
    const existing = existingByAuthId ?? existingByEmail;

    const metadataRole = authUser.user_metadata?.role as PersistedRole | undefined;
    // ponytail: strip client-controlled "admin" so new users default to candidate; existing admin rows keep role via existing?.role below
    const rawRequestedRole: PersistedRole | undefined = input.role ?? metadataRole;
    const requestedRole: PersistedRole | undefined = rawRequestedRole === "admin" ? undefined : rawRequestedRole;

    // Strict 1 Email = 1 Role check:
    // If the user already exists in the database with an assigned role, do NOT allow changing roles.
    // Existing admins are exempt so they can sign in via any login tab; their role is never mutated.
    if (existing && requestedRole && existing.role !== requestedRole && existing.role !== "admin") {
      const err = new Error(`ROLE_MISMATCH:${existing.role}:${requestedRole}`);
      err.name = "RoleMismatchError";
      throw err;
    }

    const role: PersistedRole = existing?.role ?? requestedRole ?? "candidate";

    const hasPassword =
      input.hasPassword !== undefined
        ? input.hasPassword
        : existing?.hasPassword ??
          Boolean(
            authUser.app_metadata?.providers?.includes("email") ||
            authUser.identities?.some((id) => id.provider === "email") ||
            authUser.user_metadata?.hasPassword
          );

    const [user] = existing
      ? await tx.update(schema.users).set({
          authUserId: authUser.id,
          email: authEmail,
          role: existing.role, // Never mutate an existing account's role
          hasPassword: input.hasPassword !== undefined ? input.hasPassword : existing.hasPassword || hasPassword,
          recruiterProvisioningStatus: existing.role === "recruiter" ? (existing.recruiterProvisioningStatus ?? "pending") : "active",
          updatedAt: new Date(),
        }).where(eq(schema.users.id, existing.id)).returning({
          id: schema.users.id,
          role: schema.users.role,
          recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
          hasPassword: schema.users.hasPassword,
        })
      : await tx.insert(schema.users).values({
          authUserId: authUser.id,
          email: authEmail,
          role,
          hasPassword,
          recruiterProvisioningStatus: role === "candidate" ? "active" : "pending",
        }).returning({
          id: schema.users.id,
          role: schema.users.role,
          recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus,
          hasPassword: schema.users.hasPassword,
        });

    // Ensure displayName is NOT overwritten if an existing profile already has one set
    // (e.g. Google OAuth name should never overwrite a name the user chose during onboarding)
    const [existingProfile] = await tx.select({
      displayName: schema.profiles.displayName,
    }).from(schema.profiles).where(eq(schema.profiles.userId, user.id)).limit(1);

    const isRecruiterCompanyInput = role === "recruiter" && Boolean(input.companyName);
    const providedName = isRecruiterCompanyInput ? undefined : input.name?.trim();
    const resolvedName =
      existingProfile?.displayName?.trim() && existingProfile.displayName !== input.companyName
        ? existingProfile.displayName
        : providedName ||
          (role === "recruiter"
            ? null
            : typeof authUser.user_metadata?.name === "string" &&
              authUser.user_metadata.name !== input.companyName
            ? authUser.user_metadata.name
            : authEmail.split("@")[0]);

    await tx.insert(schema.profiles).values({
      userId: user.id,
      displayName: resolvedName,
    }).onConflictDoUpdate({
      target: schema.profiles.userId,
      set: {
        ...(resolvedName !== undefined ? { displayName: resolvedName } : {}),
        updatedAt: new Date(),
      },
    });

    if (role === "recruiter") {
      const membership = await tx.select({ organizationId: schema.organizationMembers.organizationId })
        .from(schema.organizationMembers).where(eq(schema.organizationMembers.userId, user.id)).limit(1);
      let organizationId = membership[0]?.organizationId;
      if (membership.length === 0) {
        const existingOrg = await tx.select({ id: schema.organizations.id })
          .from(schema.organizations).where(eq(schema.organizations.createdBy, user.id)).limit(1);
        if (existingOrg.length > 0) {
          organizationId = existingOrg[0].id;
          await tx.insert(schema.organizationMembers).values({ organizationId, userId: user.id, role: "owner" }).onConflictDoNothing();
        } else if (input.companyName?.trim() || (typeof authUser.user_metadata?.companyName === "string" && authUser.user_metadata.companyName.trim())) {
          const orgName = input.companyName?.trim() || (authUser.user_metadata?.companyName as string).trim();
          const slug = `org-${authUser.id}`;
          const [organization] = await tx.insert(schema.organizations).values({
            name: orgName,
            slug,
            createdBy: user.id,
            verificationStatus: "pending",
          }).onConflictDoUpdate({
            target: schema.organizations.slug,
            set: { name: orgName, updatedAt: new Date() },
          }).returning({ id: schema.organizations.id });
          organizationId = organization.id;
          await tx.insert(schema.organizationMembers).values({ organizationId: organization.id, userId: user.id, role: "owner" }).onConflictDoNothing();
          await tx.insert(schema.tokenAccounts).values({ organizationId: organization.id }).onConflictDoNothing();
        } else if (user.recruiterProvisioningStatus === "active") {
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
      }
      if (organizationId && user.recruiterProvisioningStatus === "active") {
        await ShortlistService.ensureDefault(tx, organizationId, user.id);
      }

      let hasSubmittedOnboarding = false;
      if (organizationId) {
        const [org] = await tx
          .select({
            nibDocumentUrl: schema.organizations.nibDocumentUrl,
            npwpDocumentUrl: schema.organizations.npwpDocumentUrl,
          })
          .from(schema.organizations)
          .where(eq(schema.organizations.id, organizationId))
          .limit(1);
        hasSubmittedOnboarding = Boolean(org?.nibDocumentUrl && org?.npwpDocumentUrl);
      }

      return {
        userId: user.id,
        role: user.role,
        provisioningStatus: user.recruiterProvisioningStatus,
        hasSubmittedOnboarding,
        isNew: !existing,
        hasPassword: user.hasPassword,
      };
    }

    if (role === "partner") {
      const existingPartnership = await tx
        .select({ id: schema.partnerships.id, verificationStatus: schema.partnerships.verificationStatus })
        .from(schema.partnerships)
        .where(eq(schema.partnerships.userId, user.id))
        .limit(1);

      let status = existingPartnership[0]?.verificationStatus;
      if (existingPartnership.length === 0) {
        const partnerName = input.companyName?.trim() || input.name?.trim() || resolvedName || authEmail.split("@")[0];
        const [created] = await tx.insert(schema.partnerships).values({
          userId: user.id,
          name: partnerName,
          verificationStatus: "pending",
        }).returning({ id: schema.partnerships.id, verificationStatus: schema.partnerships.verificationStatus });
        status = created?.verificationStatus ?? "pending";
      }

      const partnerProvisioningStatus =
        status === "approved"
          ? ("active" as const)
          : status === "need_revision"
          ? ("revision_required" as const)
          : status === "rejected"
          ? ("rejected" as const)
          : ("pending" as const);

      return {
        userId: user.id,
        role: user.role,
        provisioningStatus: partnerProvisioningStatus,
        isNew: !existing,
        hasPassword: user.hasPassword,
      };
    }

    if (role === "candidate") {
      const [cand] = await tx
        .select({
          id: schema.candidateProfiles.id,
          isPublished: schema.candidateProfiles.isPublished,
        })
        .from(schema.candidateProfiles)
        .where(eq(schema.candidateProfiles.userId, user.id))
        .limit(1);

      const hasSubmittedOnboarding = Boolean(cand && cand.isPublished);

      return {
        userId: user.id,
        role: user.role,
        provisioningStatus: user.recruiterProvisioningStatus,
        hasSubmittedOnboarding,
        isNew: !existing,
        hasPassword: user.hasPassword,
      };
    }

    return {
      userId: user.id,
      role: user.role,
      provisioningStatus: user.recruiterProvisioningStatus,
      isNew: !existing,
      hasPassword: user.hasPassword,
    };
  });
}
