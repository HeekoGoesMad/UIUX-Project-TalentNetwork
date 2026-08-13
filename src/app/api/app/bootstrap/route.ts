import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope, getRecruiterTokenAccount } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const membership = current.user.role === "recruiter" ? await getRecruiterScope(current.db, current.user) : null;
    if (membership && "error" in membership) return NextResponse.json({ error: membership.error }, { status: membership.status });

    const [profile, candidateProfile, notifications] = await Promise.all([
      current.db.select().from(schema.profiles).where(eq(schema.profiles.userId, current.user.id)).limit(1),
      current.db.select().from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1),
      current.db.select().from(schema.notifications).where(eq(schema.notifications.userId, current.user.id)).orderBy(desc(schema.notifications.createdAt)).limit(50),
    ]);
    const candidateSections = current.user.role === "candidate" && candidateProfile[0]
      ? await current.db.select().from(schema.candidateProfileSections)
        .where(eq(schema.candidateProfileSections.candidateProfileId, candidateProfile[0].id))
      : [];

    const organization = membership && !("error" in membership)
      ? (await current.db.select().from(schema.organizations).where(eq(schema.organizations.id, membership.membership.organizationId)).limit(1))[0] ?? null
      : null;
    const shortlistRows = membership && !("error" in membership)
      ? await current.db.select({
        id: schema.shortlists.id,
        name: schema.shortlists.name,
        description: schema.shortlists.description,
        createdAt: schema.shortlists.createdAt,
        updatedAt: schema.shortlists.updatedAt,
         itemId: schema.shortlistItems.id,
         candidateProfileId: schema.shortlistItems.candidateProfileId,
         candidateName: schema.profiles.displayName,
         candidateRole: schema.candidateProfiles.headline,
         candidateLocation: schema.candidateProfiles.location,
        status: schema.shortlistItems.status,
        notes: schema.shortlistItems.notes,
        itemCreatedAt: schema.shortlistItems.createdAt,
       }).from(schema.shortlists)
         .leftJoin(schema.shortlistItems, eq(schema.shortlistItems.shortlistId, schema.shortlists.id))
         .leftJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.shortlistItems.candidateProfileId))
         .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
        .where(eq(schema.shortlists.organizationId, membership.membership.organizationId))
      : [];
    const shortlists = shortlistRows.reduce<Array<Record<string, unknown>>>((result, row) => {
      let shortlist = result.find((item) => item.id === row.id);
      if (!shortlist) {
        shortlist = { id: row.id, name: row.name, description: row.description, createdAt: row.createdAt, updatedAt: row.updatedAt, items: [] };
        result.push(shortlist);
      }
       if (row.itemId) (shortlist.items as unknown[]).push({ id: row.itemId, candidateProfileId: row.candidateProfileId, candidate: { name: row.candidateName, role: row.candidateRole, location: row.candidateLocation }, status: row.status, notes: row.notes, createdAt: row.itemCreatedAt });
      return result;
    }, []);
    const consents = current.user.role === "candidate" && candidateProfile[0]
      ? await current.db.select().from(schema.consentRequestItems).where(eq(schema.consentRequestItems.candidateProfileId, candidateProfile[0].id))
      : membership && !("error" in membership)
        ? await current.db.select().from(schema.consentRequestBatches).where(eq(schema.consentRequestBatches.organizationId, membership.membership.organizationId))
        : [];
    const screeningSummary = membership && !("error" in membership)
      ? (await current.db.select({
        total: sql<number>`count(*)`,
        pending: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'pending')`,
        completed: sql<number>`count(*) filter (where ${schema.screeningRuns.status} = 'completed')`,
      }).from(schema.screeningRuns).where(eq(schema.screeningRuns.organizationId, membership.membership.organizationId)))[0]
      : { total: 0, pending: 0, completed: 0 };
    const token = membership && !("error" in membership)
      ? await getRecruiterTokenAccount(current.db, membership.membership.organizationId)
      : { accountId: null, balance: 0, updatedAt: null };

    return NextResponse.json({
      identity: { id: current.user.id, email: current.user.email, role: current.user.role, provisioningStatus: current.user.recruiterProvisioningStatus },
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
