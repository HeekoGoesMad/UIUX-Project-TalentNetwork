import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAppUser } from "@/lib/api/auth";
import { candidateProfileForUser, uuidSchema, verificationStatusSchema } from "@/lib/cv/api";
import { getDemoVerifications } from "@/lib/cv/demo";

const patchSchema = z.object({ status: verificationStatusSchema, provider: z.string().trim().min(1).max(120).optional(), evidence: z.record(z.string(), z.unknown()).optional(), disputeReason: z.string().trim().min(10).max(1000).optional(), expiresAt: z.string().datetime().optional() }).strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ verificationId: string }> }) {
  try {
    const { verificationId } = await params;
    if (!uuidSchema.safeParse(verificationId).success) return NextResponse.json({ error: "ID verifikasi tidak valid." }, { status: 400 });
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Perubahan status verifikasi tidak valid." }, { status: 400 });
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      const row = getDemoVerifications().find((item) => item.id === verificationId);
      if (!row) return NextResponse.json({ error: "Verifikasi tidak ditemukan." }, { status: 404 });
      if (parsed.data.status !== "disputed") return NextResponse.json({ error: "Mode demo hanya memperlihatkan dispute kandidat; review admin memerlukan database." }, { status: 403 });
      row.status = "disputed"; row.disputeReason = parsed.data.disputeReason ?? null; row.updatedAt = new Date().toISOString();
      return NextResponse.json({ verification: row, demo: true });
    }
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const [verification] = await current.db.select().from(schema.candidateVerifications).where(eq(schema.candidateVerifications.id, verificationId)).limit(1);
    if (!verification) return NextResponse.json({ error: "Verifikasi tidak ditemukan." }, { status: 404 });
    const now = new Date();
    if (current.user.role === "candidate") {
      const profile = await candidateProfileForUser(current.db, current.user.id);
      if (!profile || profile.id !== verification.candidateProfileId) return NextResponse.json({ error: "Verifikasi tidak ditemukan." }, { status: 404 });
      if (parsed.data.status !== "disputed" || !parsed.data.disputeReason) return NextResponse.json({ error: "Kandidat hanya dapat mengajukan dispute dengan alasan." }, { status: 403 });
      if (!["verified", "expired", "revoked"].includes(verification.status)) return NextResponse.json({ error: "Verifikasi ini belum dapat disengketakan." }, { status: 409 });
    } else if (current.user.role !== "admin") {
      return NextResponse.json({ error: "Admin diperlukan untuk mengubah status verifikasi." }, { status: 403 });
    }
    const [updated] = await current.db.update(schema.candidateVerifications).set({ status: parsed.data.status, provider: parsed.data.provider, evidence: parsed.data.evidence, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined, disputeReason: parsed.data.disputeReason ?? (parsed.data.status === "disputed" ? verification.disputeReason : null), verifiedAt: parsed.data.status === "verified" ? now : null, revokedAt: parsed.data.status === "revoked" ? now : null, updatedAt: now }).where(eq(schema.candidateVerifications.id, verificationId)).returning();
    await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: current.user.role === "candidate" ? "candidate.verification.disputed" : "admin.verification.status_updated", entityType: "candidate_verification", entityId: verificationId, metadata: { from: verification.status, to: updated.status, reason: parsed.data.disputeReason ?? null, provider: parsed.data.provider ?? null, expiresAt: parsed.data.expiresAt ?? null } });
    return NextResponse.json({ verification: updated });
  } catch (error) { console.error("Verification update failed", error); return NextResponse.json({ error: "Status verifikasi belum dapat diperbarui." }, { status: 503 }); }
}
