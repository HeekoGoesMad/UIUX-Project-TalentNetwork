import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { candidateProfileForUser, verificationTypeSchema } from "@/lib/cv/api";
import { writeAuditLog } from "@/lib/audit";
import { getDemoVerifications, getDemoCandidateProfileId } from "@/lib/cv/demo";

const requestSchema = z.object({ type: verificationTypeSchema, evidence: z.record(z.string(), z.unknown()).optional() }).strict();

export async function GET() {
  try {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") return NextResponse.json({ verifications: getDemoVerifications(), demo: true });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role === "candidate") {
      const profile = await candidateProfileForUser(current.db, current.user.id);
      if (!profile) return NextResponse.json({ verifications: [] });
      const verifications = await current.db.select().from(schema.candidateVerifications).where(eq(schema.candidateVerifications.candidateProfileId, profile.id)).orderBy(desc(schema.candidateVerifications.createdAt));
      return NextResponse.json({ verifications });
    }
    if (current.user.role !== "admin") return NextResponse.json({ error: "Akses admin diperlukan." }, { status: 403 });
    const verifications = await current.db.select({ verification: schema.candidateVerifications, profile: schema.candidateProfiles, user: schema.users }).from(schema.candidateVerifications).innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.candidateVerifications.candidateProfileId)).innerJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId)).orderBy(desc(schema.candidateVerifications.createdAt));
    return NextResponse.json({ verifications });
  } catch (error) { console.error("Verification list failed", error); return NextResponse.json({ error: "Data verifikasi belum tersedia." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true") {
      const parsedDemo = requestSchema.safeParse(await request.json());
      if (!parsedDemo.success) return NextResponse.json({ error: "Jenis verifikasi atau bukti tidak valid." }, { status: 400 });
      const now = new Date().toISOString();
      const verification = { id: crypto.randomUUID(), candidateProfileId: getDemoCandidateProfileId(), type: parsedDemo.data.type, status: "pending" as const, evidence: parsedDemo.data.evidence ?? {}, provider: "development-mock", verifiedAt: null, expiresAt: null, revokedAt: null, disputeReason: null, createdAt: now, updatedAt: now };
      getDemoVerifications().unshift(verification);
      return NextResponse.json({ verification, demo: true }, { status: 201 });
    }
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat meminta verifikasi." }, { status: 403 });
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Jenis verifikasi atau bukti tidak valid." }, { status: 400 });
    const profile = await candidateProfileForUser(current.db, current.user.id);
    if (!profile) return NextResponse.json({ error: "Profil kandidat belum tersedia." }, { status: 409 });
    const [verification] = await current.db.insert(schema.candidateVerifications).values({ candidateProfileId: profile.id, type: parsed.data.type, evidence: parsed.data.evidence ?? {} }).returning();
    await writeAuditLog({ db: current.db, actorUserId: current.user.id, action: "candidate.verification.requested", entityType: "candidate_verification", entityId: verification.id, metadata: { type: verification.type } });
    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) { console.error("Verification request failed", error); return NextResponse.json({ error: "Permintaan verifikasi belum dapat dibuat." }, { status: 503 }); }
}
