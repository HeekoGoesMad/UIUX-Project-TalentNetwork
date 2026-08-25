import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { uuidSchema } from "@/lib/assessment";
import { writeAuditLog } from "@/lib/audit";

const createSchema = z.object({ invitationId: uuidSchema }).strict();
export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invitation tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat memulai assessment." }, { status: 403 });
    const [candidate] = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
    const result = await current.db.transaction(async (tx) => {
      const [invitation] = await tx.select().from(schema.assessmentInvitations).where(and(eq(schema.assessmentInvitations.id, parsed.data.invitationId), eq(schema.assessmentInvitations.candidateProfileId, candidate?.id ?? ""))).limit(1);
      if (!invitation) return { error: "Invitation assessment tidak ditemukan.", status: 404 as const };
      if (invitation.expiresAt && invitation.expiresAt <= new Date()) return { error: "Invitation assessment sudah kedaluwarsa.", status: 410 as const };
      if (["submitted", "revoked", "expired"].includes(invitation.status)) return { error: "Invitation assessment tidak lagi dapat dimulai.", status: 409 as const };
      const [existing] = await tx.select().from(schema.assessmentAttempts).where(eq(schema.assessmentAttempts.invitationId, invitation.id)).orderBy(desc(schema.assessmentAttempts.attemptNumber)).limit(1);
      if (existing && existing.status === "in_progress") return { attempt: existing };
      const attemptNumber = (existing?.attemptNumber ?? 0) + 1;
      if (attemptNumber > 5) return { error: "Batas percobaan assessment tercapai.", status: 409 as const };
      const [attempt] = await tx.insert(schema.assessmentAttempts).values({ invitationId: invitation.id, attemptNumber }).returning();
      await tx.update(schema.assessmentInvitations).set({ status: "started", updatedAt: new Date() }).where(eq(schema.assessmentInvitations.id, invitation.id));
      const [job] = await tx.select({ organizationId: schema.jobs.organizationId }).from(schema.applications).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).where(eq(schema.applications.id, invitation.applicationId)).limit(1);
      await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: job?.organizationId ?? null, action: "assessment.attempt.started", entityType: "assessment_attempt", entityId: attempt.id, metadata: { invitationId: invitation.id, attemptNumber } });
      return { attempt };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { console.error("Assessment attempt create failed", error); return NextResponse.json({ error: "Attempt assessment belum dapat dimulai." }, { status: 503 }); }
}
