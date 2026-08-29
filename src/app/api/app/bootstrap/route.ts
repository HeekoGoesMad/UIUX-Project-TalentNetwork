import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope, getRecruiterTokenAccount } from "@/lib/api/auth";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";
import { createClient } from "@/lib/supabase/server";
import { ShortlistService } from "@/lib/services/shortlist";

export async function GET() {
  try {
    let current = await getCurrentAppUser({ allowPending: true });
    if ("error" in current && current.status === 403) {
      // Fresh login race: auth session exists but the profile row is not
      // synced yet. Self-heal by syncing now instead of failing the call.
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        try {
          await syncAuthenticatedUser(data.user, {});
          current = await getCurrentAppUser({ allowPending: true });
        } catch {
          // fall through to the original error below
        }
      }
    }
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const isRecruiterActive = current.user.role === "recruiter" && current.user.recruiterProvisioningStatus === "active";
    const membership = isRecruiterActive ? await getRecruiterScope(current.db, current.user) : null;
    const activeOrgId = membership && !("error" in membership) ? membership.membership.organizationId : null;

    const [profile, candidateProfile, notifications] = await Promise.all([
      current.db.select().from(schema.profiles).where(eq(schema.profiles.userId, current.user.id)).limit(1),
      current.db.select().from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1),
      current.db.select().from(schema.notifications).where(eq(schema.notifications.userId, current.user.id)).orderBy(desc(schema.notifications.createdAt)).limit(50),
    ]);
    const candidateSections = current.user.role === "candidate" && candidateProfile[0]
      ? await current.db.select().from(schema.candidateProfileSections)
        .where(eq(schema.candidateProfileSections.candidateProfileId, candidateProfile[0].id))
      : [];

    const organization = activeOrgId
      ? (await current.db.select().from(schema.organizations).where(eq(schema.organizations.id, activeOrgId)).limit(1))[0] ?? null
      : null;
    const shortlists = activeOrgId
      ? (await ShortlistService.list(current.db, activeOrgId)).shortlists
      : [];
    const consents = current.user.role === "candidate" && candidateProfile[0]
      ? await current.db.select().from(schema.consentRequestItems).where(eq(schema.consentRequestItems.candidateProfileId, candidateProfile[0].id))
      : activeOrgId
        ? await current.db.select().from(schema.consentRequestBatches).where(eq(schema.consentRequestBatches.organizationId, activeOrgId))
        : [];
    const screeningSummary = activeOrgId
      ? (await current.db.select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'pending')`,
        completed: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'completed')`,
      }).from(schema.screeningRuns).where(eq(schema.screeningRuns.organizationId, activeOrgId)))[0]
      : { total: 0, pending: 0, completed: 0 };
    const token = activeOrgId
      ? await getRecruiterTokenAccount(current.db, activeOrgId)
      : { accountId: null, balance: 0, updatedAt: null };

    return NextResponse.json({
      identity: {
        id: current.user.id,
        email: current.user.email,
        name: profile[0]?.displayName ?? current.user.email?.split("@")[0] ?? "Pengguna",
        role: current.user.role,
        provisioningStatus: current.user.recruiterProvisioningStatus,
        provisioningReason: current.user.recruiterRejectionReason ?? null,
      },
      organization,
      profile: profile[0] ?? null,
      candidateProfile: candidateProfile[0] ?? null,
      candidateSections,
      shortlists,
      consentRequests: consents,
      notifications,
      token,
      screeningSummary: {
        total: Number(screeningSummary?.total ?? 0),
        pending: Number(screeningSummary?.pending ?? 0),
        completed: Number(screeningSummary?.completed ?? 0),
      },
    });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
