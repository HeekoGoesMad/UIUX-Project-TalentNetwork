import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";
import { GET as getConsentRequests } from "./read";

export { getConsentRequests as GET };

const requestSchema = z.object({
  candidateProfileIds: z.array(z.string().uuid()).min(1).max(100),
  purpose: z.string().trim().min(1).max(500),
  message: z.string().trim().max(2_000).nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
}).superRefine((value, context) => {
  if (new Set(value.candidateProfileIds).size !== value.candidateProfileIds.length) {
    context.addIssue({ code: "custom", path: ["candidateProfileIds"], message: "Candidate profile IDs must be unique." });
  }
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data consent request tidak valid.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });

    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [recruiter] = await tx.select({ id: schema.users.id, role: schema.users.role, recruiterProvisioningStatus: schema.users.recruiterProvisioningStatus })
        .from(schema.users)
        .where(eq(schema.users.authUserId, authUser.id))
        .limit(1);
      if (!recruiter) return { error: "Profil pengguna tidak ditemukan.", status: 403 as const };
      if (recruiter.role !== "recruiter") return { error: "Hanya recruiter yang dapat meminta consent.", status: 403 as const };
      if (recruiter.recruiterProvisioningStatus !== "active") return { error: "Recruiter masih menunggu provisioning organisasi.", status: 403 as const };

      const [membership] = await tx.select({ organizationId: schema.organizationMembers.organizationId })
        .from(schema.organizationMembers)
        .where(eq(schema.organizationMembers.userId, recruiter.id))
        .limit(1);
      if (!membership) return { error: "Recruiter belum tergabung dalam organisasi.", status: 403 as const };

      const candidates = await tx.select({
        id: schema.candidateProfiles.id,
        userId: schema.candidateProfiles.userId,
      })
        .from(schema.candidateProfiles)
        .where(inArray(schema.candidateProfiles.id, parsed.data.candidateProfileIds));
      if (candidates.length !== parsed.data.candidateProfileIds.length) {
        return { error: "Satu atau lebih candidate profile tidak ditemukan.", status: 404 as const };
      }

      const [batch] = await tx.insert(schema.consentRequestBatches).values({
        organizationId: membership.organizationId,
        requestedBy: recruiter.id,
        purpose: parsed.data.purpose,
        message: parsed.data.message ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      }).returning({ id: schema.consentRequestBatches.id });

      const items = await tx.insert(schema.consentRequestItems).values(
        parsed.data.candidateProfileIds.map((candidateProfileId) => ({ batchId: batch.id, candidateProfileId }))
      ).returning({ id: schema.consentRequestItems.id, candidateProfileId: schema.consentRequestItems.candidateProfileId });

      await tx.insert(schema.consentEvents).values(items.map((item) => ({
        consentRequestItemId: item.id,
        actorUserId: recruiter.id,
        type: "requested" as const,
        metadata: { purpose: parsed.data.purpose, expiresAt: parsed.data.expiresAt ?? null },
      })));
      await Promise.all(items.map((item) => writeAuditLog({
        db: tx,
        actorUserId: recruiter.id,
        organizationId: membership.organizationId,
        action: "consent.request.created",
        entityType: "consent_request_item",
        entityId: item.id,
        metadata: { purpose: parsed.data.purpose, hasMessage: Boolean(parsed.data.message), expiresAt: parsed.data.expiresAt ?? null },
      })));

      await Promise.all(candidates.map((candidate) => createNotificationWithDeliveries(tx, systemNotification({
        userId: candidate.userId,
        title: "Permintaan consent baru",
        body: "Recruiter meminta consent untuk mengakses profil Anda.",
        data: notificationData(`consent-request:${batch.id}:${candidate.id}`, "/candidate/consent-requests", { batchId: batch.id, candidateProfileId: candidate.id }),
      }))));

      return { batchId: batch.id, itemIds: items.map((item) => item.id) };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
