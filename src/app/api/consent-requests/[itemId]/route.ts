import { NextResponse } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";

const decisionSchema = z.object({ decision: z.enum(["approved", "declined", "revoked"]) });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  if (!z.string().uuid().safeParse(itemId).success) {
    return NextResponse.json({ error: "Consent item ID tidak valid." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body tidak valid." }, { status: 400 });
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Decision harus approved atau declined." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });

    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const [actor] = await tx.select({ id: schema.users.id, role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.authUserId, authUser.id))
        .limit(1);
      if (!actor) return { error: "Profil pengguna tidak ditemukan.", status: 403 as const };

      const [item] = await tx.select({
        id: schema.consentRequestItems.id,
         candidateProfileId: schema.consentRequestItems.candidateProfileId,
         requestedBy: schema.consentRequestBatches.requestedBy,
         organizationId: schema.consentRequestBatches.organizationId,
         status: schema.consentRequestItems.status,
      })
        .from(schema.consentRequestItems)
        .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.consentRequestItems.candidateProfileId))
        .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
         .where(eq(schema.consentRequestItems.id, itemId))
         .limit(1);
       if (!item) return { error: "Consent request tidak ditemukan.", status: 404 as const };
       if (parsed.data.decision === "revoked") {
         if (actor.role !== "recruiter") return { error: "Hanya recruiter yang dapat mencabut consent.", status: 403 as const };
         const [membership] = await tx.select({ organizationId: schema.organizationMembers.organizationId }).from(schema.organizationMembers).where(and(eq(schema.organizationMembers.organizationId, item.organizationId), eq(schema.organizationMembers.userId, actor.id))).limit(1);
         if (!membership) return { error: "Anda tidak memiliki akses ke organisasi ini.", status: 403 as const };
       } else if (actor.role !== "candidate") return { error: "Hanya candidate yang dapat merespons consent.", status: 403 as const };
       if (actor.role === "candidate") {
         const [candidateProfile] = await tx.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(and(eq(schema.candidateProfiles.id, item.candidateProfileId), eq(schema.candidateProfiles.userId, actor.id))).limit(1);
         if (!candidateProfile) return { error: "Consent request tidak ditemukan.", status: 404 as const };
       }

      const [updated] = await tx.update(schema.consentRequestItems)
        .set({ status: parsed.data.decision, respondedAt: new Date(), updatedAt: new Date() })
         .where(and(eq(schema.consentRequestItems.id, item.id), or(eq(schema.consentRequestItems.status, "pending"), eq(schema.consentRequestItems.status, "approved"))))
        .returning({ id: schema.consentRequestItems.id, status: schema.consentRequestItems.status });
      if (!updated) return { error: "Consent request sudah memiliki respons.", status: 409 as const };

      await tx.insert(schema.consentEvents).values({
        consentRequestItemId: updated.id,
         actorUserId: actor.id,
        type: parsed.data.decision,
        metadata: { respondedAt: new Date().toISOString() },
      });
      await writeAuditLog({
        db: tx,
        actorUserId: actor.id,
        organizationId: item.organizationId,
        action: `consent.${parsed.data.decision}`,
        entityType: "consent_request_item",
        entityId: updated.id,
        metadata: { previousStatus: item.status, status: updated.status },
      });
       await createNotificationWithDeliveries(tx, systemNotification({
         userId: item.requestedBy,
         title: "Respons consent diterima",
         body: `Candidate ${parsed.data.decision === "approved" ? "menyetujui" : "menolak"} permintaan consent Anda.`,
         data: notificationData(`consent-response:${updated.id}:${updated.status}`, "/recruiter/consent-requests", { consentRequestItemId: updated.id, status: updated.status }),
       }));

      return { itemId: updated.id, consentStatus: updated.status };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
