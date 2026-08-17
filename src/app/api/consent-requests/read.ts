import { NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const isCandidate = current.user.role === "candidate";
    const scope = isCandidate ? null : await getRecruiterScope(current.db, current.user);
    if (scope && "error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });

    const candidateProfile = isCandidate
      ? (await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1))[0]
      : undefined;
    if (isCandidate && !candidateProfile) return NextResponse.json({ requests: [] });

    const where = isCandidate
      ? eq(schema.consentRequestItems.candidateProfileId, candidateProfile!.id)
      : eq(schema.consentRequestBatches.organizationId, scope!.membership.organizationId);
    const rows = await current.db.select({
      itemId: schema.consentRequestItems.id,
      batchId: schema.consentRequestBatches.id,
      purpose: schema.consentRequestBatches.purpose,
      message: schema.consentRequestBatches.message,
      expiresAt: schema.consentRequestBatches.expiresAt,
      requestedBy: schema.consentRequestBatches.requestedBy,
      status: schema.consentRequestItems.status,
      respondedAt: schema.consentRequestItems.respondedAt,
      createdAt: schema.consentRequestItems.createdAt,
      candidateProfileId: schema.consentRequestItems.candidateProfileId,
      recruiterName: schema.profiles.displayName,
      recruiterEmail: schema.users.email,
      organizationName: schema.organizations.name,
    }).from(schema.consentRequestItems)
      .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.consentRequestBatches.organizationId))
      .innerJoin(schema.users, eq(schema.users.id, schema.consentRequestBatches.requestedBy))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .where(where).orderBy(asc(schema.consentRequestItems.createdAt));

    const events = rows.length
      ? await current.db.select({
        itemId: schema.consentEvents.consentRequestItemId,
        type: schema.consentEvents.type,
        metadata: schema.consentEvents.metadata,
        createdAt: schema.consentEvents.createdAt,
      }).from(schema.consentEvents)
        .where(inArray(schema.consentEvents.consentRequestItemId, rows.map((row) => row.itemId)))
      : [];
    const state = (status: typeof rows[number]["status"]) => ({
      pending: "pending-candidate-consent",
      approved: "consented",
      declined: "declined",
      revoked: "withdrawn",
      expired: "consent-expired",
    }[status]);

    return NextResponse.json({
      requests: rows.map((row) => ({
        ...row,
        consentState: state(row.status),
        history: events.filter((event) => event.itemId === row.itemId),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
