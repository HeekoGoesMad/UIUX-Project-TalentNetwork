import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { createClient } from "@/lib/supabase/server";

const decisionSchema = z.object({ decision: z.enum(["approved", "declined"]) });

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
      const [candidate] = await tx.select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.authUserId, authUser.id), eq(schema.users.role, "candidate")))
        .limit(1);
      if (!candidate) return { error: "Hanya candidate yang dapat merespons consent.", status: 403 as const };

      const [item] = await tx.select({
        id: schema.consentRequestItems.id,
        candidateProfileId: schema.consentRequestItems.candidateProfileId,
        requestedBy: schema.consentRequestBatches.requestedBy,
      })
        .from(schema.consentRequestItems)
        .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.consentRequestItems.candidateProfileId))
        .innerJoin(schema.consentRequestBatches, eq(schema.consentRequestBatches.id, schema.consentRequestItems.batchId))
        .where(and(eq(schema.consentRequestItems.id, itemId), eq(schema.candidateProfiles.userId, candidate.id)))
        .limit(1);
      if (!item) return { error: "Consent request tidak ditemukan.", status: 404 as const };

      const [updated] = await tx.update(schema.consentRequestItems)
        .set({ status: parsed.data.decision, respondedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(schema.consentRequestItems.id, item.id), eq(schema.consentRequestItems.status, "pending")))
        .returning({ id: schema.consentRequestItems.id, status: schema.consentRequestItems.status });
      if (!updated) return { error: "Consent request sudah memiliki respons.", status: 409 as const };

      await tx.insert(schema.consentEvents).values({
        consentRequestItemId: updated.id,
        actorUserId: candidate.id,
        type: parsed.data.decision,
        metadata: { respondedAt: new Date().toISOString() },
      });
      await tx.insert(schema.notifications).values({
        userId: item.requestedBy,
        type: "consent_updated",
        title: "Respons consent diterima",
        body: `Candidate ${parsed.data.decision === "approved" ? "menyetujui" : "menolak"} permintaan consent Anda.`,
        data: { consentRequestItemId: updated.id, status: updated.status },
      });

      return { itemId: updated.id, consentStatus: updated.status };
    });

    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
