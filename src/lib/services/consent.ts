import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { schema, type Database } from "@/db";
import type { AppUser } from "@/lib/api/auth";

export class ConsentService {
  /**
   * Retrieve all consent requests for a candidate or recruiter organization.
   */
  static async getConsentRequests(
    db: Database,
    user: AppUser,
    scope?: { membership: { organizationId: string } } | null
  ) {
    const isCandidate = user.role === "candidate";

    const candidateProfile = isCandidate
      ? (
          await db
            .select({ id: schema.candidateProfiles.id })
            .from(schema.candidateProfiles)
            .where(eq(schema.candidateProfiles.userId, user.id))
            .limit(1)
        )[0]
      : undefined;

    if (isCandidate && !candidateProfile) {
      return { requests: [] };
    }

    const where = isCandidate
      ? eq(schema.consentRequestItems.candidateProfileId, candidateProfile!.id)
      : eq(schema.consentRequestBatches.organizationId, scope!.membership.organizationId);

    const rows = await db
      .select({
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
      })
      .from(schema.consentRequestItems)
      .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.consentRequestBatches.organizationId))
      .innerJoin(schema.users, eq(schema.users.id, schema.consentRequestBatches.requestedBy))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .where(where)
      .orderBy(asc(schema.consentRequestItems.createdAt));

    const events = rows.length
      ? await db
          .select({
            itemId: schema.consentEvents.consentRequestItemId,
            type: schema.consentEvents.type,
            metadata: schema.consentEvents.metadata,
            createdAt: schema.consentEvents.createdAt,
          })
          .from(schema.consentEvents)
          .where(
            inArray(
              schema.consentEvents.consentRequestItemId,
              rows.map((row) => row.itemId)
            )
          )
      : [];

    const mapState = (status: (typeof rows)[number]["status"]) =>
      ({
        pending: "pending-candidate-consent",
        approved: "consented",
        declined: "declined",
        revoked: "withdrawn",
        expired: "consent-expired",
      })[status];

    return {
      requests: rows.map((row) => ({
        ...row,
        consentState: mapState(row.status),
        history: events.filter((event) => event.itemId === row.itemId),
      })),
    };
  }

  /**
   * Create a new consent request batch for multiple candidates.
   */
  static async createBatch(
    db: Database,
    params: {
      organizationId: string;
      recruiterId: string;
      candidateProfileIds: string[];
      purpose: string;
      message?: string | null;
      expiresAt?: string | null;
    }
  ) {
    return db.transaction(async (tx) => {
      const candidates = await tx
        .select({
          id: schema.candidateProfiles.id,
          userId: schema.candidateProfiles.userId,
        })
        .from(schema.candidateProfiles)
        .where(inArray(schema.candidateProfiles.id, params.candidateProfileIds));

      if (candidates.length !== params.candidateProfileIds.length) {
        return { error: "Satu atau lebih candidate profile tidak ditemukan.", status: 404 as const };
      }

      const [batch] = await tx
        .insert(schema.consentRequestBatches)
        .values({
          organizationId: params.organizationId,
          requestedBy: params.recruiterId,
          purpose: params.purpose,
          message: params.message ?? null,
          expiresAt: params.expiresAt ? new Date(params.expiresAt) : null,
        })
        .returning({ id: schema.consentRequestBatches.id });

      const items = await tx
        .insert(schema.consentRequestItems)
        .values(
          params.candidateProfileIds.map((candidateProfileId) => ({
            batchId: batch.id,
            candidateProfileId,
          }))
        )
        .returning({
          id: schema.consentRequestItems.id,
          candidateProfileId: schema.consentRequestItems.candidateProfileId,
        });

      await tx.insert(schema.consentEvents).values(
        items.map((item) => ({
          consentRequestItemId: item.id,
          actorUserId: params.recruiterId,
          type: "requested" as const,
          metadata: { purpose: params.purpose, expiresAt: params.expiresAt ?? null },
        }))
      );

      await tx.insert(schema.notifications).values(
        candidates.map((candidate) => ({
          userId: candidate.userId,
          type: "consent_requested" as const,
          title: "Permintaan consent baru",
          body: params.message ?? `Recruiter meminta consent untuk: ${params.purpose}`,
          data: { batchId: batch.id, candidateProfileId: candidate.id },
        }))
      );

      return { batchId: batch.id, itemIds: items.map((item) => item.id) };
    });
  }

  /**
   * Candidate responds to a consent request item (approved or declined).
   */
  static async respondToConsent(
    db: Database,
    params: {
      candidateUserId: string;
      itemId: string;
      decision: "approved" | "declined";
    }
  ) {
    return db.transaction(async (tx) => {
      const [item] = await tx
        .select({
          id: schema.consentRequestItems.id,
          candidateProfileId: schema.consentRequestItems.candidateProfileId,
          requestedBy: schema.consentRequestBatches.requestedBy,
        })
        .from(schema.consentRequestItems)
        .innerJoin(
          schema.candidateProfiles,
          eq(schema.candidateProfiles.id, schema.consentRequestItems.candidateProfileId)
        )
        .innerJoin(
          schema.consentRequestBatches,
          eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId)
        )
        .where(
          and(
            eq(schema.consentRequestItems.id, params.itemId),
            eq(schema.candidateProfiles.userId, params.candidateUserId)
          )
        )
        .limit(1);

      if (!item) {
        return { error: "Consent request tidak ditemukan.", status: 404 as const };
      }

      const [updated] = await tx
        .update(schema.consentRequestItems)
        .set({
          status: params.decision,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.consentRequestItems.id, item.id),
            eq(schema.consentRequestItems.status, "pending")
          )
        )
        .returning({
          id: schema.consentRequestItems.id,
          status: schema.consentRequestItems.status,
        });

      if (!updated) {
        return { error: "Consent request sudah memiliki respons.", status: 409 as const };
      }

      await tx.insert(schema.consentEvents).values({
        consentRequestItemId: updated.id,
        actorUserId: params.candidateUserId,
        type: params.decision,
        metadata: { respondedAt: new Date().toISOString() },
      });

      await tx.insert(schema.notifications).values({
        userId: item.requestedBy,
        type: "consent_updated",
        title: "Respons consent diterima",
        body: `Candidate ${params.decision === "approved" ? "menyetujui" : "menolak"} permintaan consent Anda.`,
        data: { consentRequestItemId: updated.id, status: updated.status },
      });

      return { itemId: updated.id, consentStatus: updated.status };
    });
  }
}
