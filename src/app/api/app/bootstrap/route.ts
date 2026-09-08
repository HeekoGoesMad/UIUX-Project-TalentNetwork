import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterTokenAccount } from "@/lib/api/auth";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";
import { createClient } from "@/lib/supabase/server";
import { ShortlistService } from "@/lib/services/shortlist";
import { ConsentService } from "@/lib/services/consent";

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

    const isRecruiter = current.user.role === "recruiter";
    const isCandidate = current.user.role === "candidate";

    // Batch 1: Concurrently load base profile, candidate profile, notifications, and organization membership
    const [profileRows, candidateProfileRows, notifications, memberRows] = await Promise.all([
      current.db.select().from(schema.profiles).where(eq(schema.profiles.userId, current.user.id)).limit(1),
      isCandidate
        ? current.db.select().from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1)
        : Promise.resolve([]),
      current.db.select().from(schema.notifications).where(eq(schema.notifications.userId, current.user.id)).orderBy(desc(schema.notifications.createdAt)).limit(50),
      isRecruiter
        ? current.db.select().from(schema.organizationMembers).where(eq(schema.organizationMembers.userId, current.user.id)).limit(1)
        : Promise.resolve([]),
    ]);

    const profile = profileRows[0] ?? null;
    const candidateProfile = candidateProfileRows[0] ?? null;
    const recruiterMember = memberRows[0] ?? null;
    const isRecruiterActive = isRecruiter && current.user.recruiterProvisioningStatus === "active";
    const resolvedOrgId = recruiterMember?.organizationId ?? null;
    const activeOrgId = isRecruiterActive ? resolvedOrgId : null;
    const recruiterScope = activeOrgId && recruiterMember
      ? { membership: { organizationId: activeOrgId, organizationRole: recruiterMember.role } }
      : null;

    // Batch 2: Concurrently load dependent resources (sections, org details, shortlists, consents, screenings, tokens)
    const [
      candidateSections,
      organization,
      shortlistResult,
      consentResult,
      screeningSummaryRaw,
      token,
    ] = await Promise.all([
      candidateProfile
        ? current.db.select().from(schema.candidateProfileSections).where(eq(schema.candidateProfileSections.candidateProfileId, candidateProfile.id))
        : Promise.resolve([]),
      resolvedOrgId
        ? current.db.select().from(schema.organizations).where(eq(schema.organizations.id, resolvedOrgId)).limit(1).then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      activeOrgId
        ? ShortlistService.list(current.db, activeOrgId)
        : Promise.resolve({ shortlists: [] }),
      (isCandidate || activeOrgId)
        ? ConsentService.getConsentRequests(current.db, current.user, recruiterScope, { page: 1, limit: 100 })
        : Promise.resolve({ requests: [] }),
      activeOrgId
        ? current.db.select({
            total: sql<number>`count(*)`,
            pending: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'pending')`,
            completed: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'completed')`,
          }).from(schema.screeningRuns).where(eq(schema.screeningRuns.organizationId, activeOrgId)).then((rows) => rows[0])
        : Promise.resolve({ total: 0, pending: 0, completed: 0 }),
      activeOrgId
        ? getRecruiterTokenAccount(current.db, activeOrgId)
        : Promise.resolve({ accountId: null, balance: 0, updatedAt: null }),
    ]);

    return NextResponse.json({
      identity: {
        id: current.user.id,
        email: current.user.email,
        name: profile?.displayName ?? current.user.email?.split("@")[0] ?? "Pengguna",
        role: current.user.role,
        provisioningStatus: current.user.recruiterProvisioningStatus,
        provisioningReason: current.user.recruiterRejectionReason ?? null,
      },
      organization,
      profile,
      candidateProfile,
      candidateSections,
      shortlists: shortlistResult.shortlists,
      consentRequests: consentResult.requests,
      notifications,
      token,
      screeningSummary: {
        total: Number(screeningSummaryRaw?.total ?? 0),
        pending: Number(screeningSummaryRaw?.pending ?? 0),
        completed: Number(screeningSummaryRaw?.completed ?? 0),
      },
    });
  } catch (err) {
    console.error("Error in /api/app/bootstrap:", err);
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
