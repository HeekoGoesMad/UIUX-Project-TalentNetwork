import { and, asc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { parseResponse, uuidSchema } from "@/lib/assessment";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

const patchSchema = z.object({ questionId: uuidSchema.optional(), response: z.unknown().optional(), submit: z.boolean().optional() }).strict();
export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params; if (!uuidSchema.safeParse(attemptId).success) return NextResponse.json({ error: "ID attempt tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const access = await findAttempt(current, attemptId); if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    const questions = await current.db.select().from(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.assessmentTemplateId, access.template.id)).orderBy(asc(schema.assessmentQuestions.sortOrder));
    const answers = await current.db.select().from(schema.assessmentAnswers).where(eq(schema.assessmentAnswers.attemptId, attemptId));
    const [review] = await current.db.select({ status: schema.assessmentReviews.status, score: schema.assessmentReviews.score, reviewedAt: schema.assessmentReviews.reviewedAt, dimensionScores: schema.assessmentReviews.dimensionScores, notes: schema.assessmentReviews.notes }).from(schema.assessmentReviews).where(eq(schema.assessmentReviews.attemptId, attemptId)).limit(1);
    const safeReview = current.user.role === "candidate" ? (review ? { status: review.status, score: review.score, reviewedAt: review.reviewedAt } : null) : (review ?? null);
    return NextResponse.json({ attempt: access.attempt, invitation: access.invitation, template: access.template, questions, answers: current.user.role === "recruiter" && access.attempt.status !== "submitted" ? [] : answers, review: safeReview });
  } catch (error) { console.error("Assessment attempt detail failed", error); return NextResponse.json({ error: "Attempt assessment belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params; if (!uuidSchema.safeParse(attemptId).success) return NextResponse.json({ error: "ID attempt tidak valid." }, { status: 400 });
    const parsed = patchSchema.safeParse(await request.json()); if (!parsed.success || (!parsed.data.submit && !parsed.data.questionId)) return NextResponse.json({ error: "Autosave membutuhkan pertanyaan atau submit." }, { status: 400 });
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const access = await findAttempt(current, attemptId); if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Recruiter hanya dapat membaca attempt yang sudah dikirim." }, { status: 403 });
    if (access.attempt.status !== "in_progress") return NextResponse.json({ error: "Attempt sudah dikunci dan tidak dapat diubah." }, { status: 409 });
    if (access.invitation.expiresAt && access.invitation.expiresAt <= new Date()) return NextResponse.json({ error: "Invitation assessment sudah kedaluwarsa." }, { status: 410 });
    const result = await current.db.transaction(async (tx) => {
      if (parsed.data.questionId) {
        const [question] = await tx.select({ id: schema.assessmentQuestions.id }).from(schema.assessmentQuestions).where(and(eq(schema.assessmentQuestions.id, parsed.data.questionId), eq(schema.assessmentQuestions.assessmentTemplateId, access.template.id))).limit(1);
        if (!question) return { error: "Pertanyaan bukan bagian dari assessment ini.", status: 400 as const };
        await tx.insert(schema.assessmentAnswers).values({ attemptId, questionId: question.id, response: parseResponse(parsed.data.response), savedAt: new Date() }).onConflictDoUpdate({ target: [schema.assessmentAnswers.attemptId, schema.assessmentAnswers.questionId], set: { response: parseResponse(parsed.data.response), savedAt: new Date() } });
      }
      if (parsed.data.submit) {
        const required = await tx.select({ id: schema.assessmentQuestions.id }).from(schema.assessmentQuestions).where(and(eq(schema.assessmentQuestions.assessmentTemplateId, access.template.id), eq(schema.assessmentQuestions.isRequired, true)));
        const answers = await tx.select({ questionId: schema.assessmentAnswers.questionId }).from(schema.assessmentAnswers).where(eq(schema.assessmentAnswers.attemptId, attemptId));
        if (required.some((question) => !answers.some((answer) => answer.questionId === question.id))) return { error: "Jawab semua pertanyaan wajib sebelum mengirim.", status: 400 as const };
         const now = new Date(); await tx.update(schema.assessmentAttempts).set({ status: "submitted", submittedAt: now, updatedAt: now }).where(eq(schema.assessmentAttempts.id, attemptId)); await tx.update(schema.assessmentAnswers).set({ submittedAt: now }).where(eq(schema.assessmentAnswers.attemptId, attemptId)); await tx.update(schema.assessmentInvitations).set({ status: "submitted", updatedAt: now }).where(eq(schema.assessmentInvitations.id, access.invitation.id));
          await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: access.jobOrganizationId, action: "assessment.attempt.submitted", entityType: "assessment_attempt", entityId: attemptId, metadata: { invitationId: access.invitation.id } });
         const recipients = await tx.select({ userId: schema.organizationMembers.userId }).from(schema.organizationMembers)
           .innerJoin(schema.users, eq(schema.users.id, schema.organizationMembers.userId))
           .where(and(eq(schema.organizationMembers.organizationId, access.jobOrganizationId), or(inArray(schema.organizationMembers.role, ["owner", "admin"]), and(eq(schema.organizationMembers.role, "recruiter"), eq(schema.users.recruiterProvisioningStatus, "active")))));
          await Promise.all(recipients.map(({ userId }) => createNotificationWithDeliveries(tx, systemNotification({ userId, title: "Assessment selesai dikirim", body: `Kandidat mengirim jawaban untuk ${access.template.name}.`, data: notificationData(`assessment-attempt:${attemptId}:submitted:${userId}`, `/recruiter/assessments/attempts/${attemptId}`, { attemptId, status: "submitted" }) }))));
      }
      return { ok: true };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ saved: true, submitted: Boolean(parsed.data.submit) });
  } catch (error) { console.error("Assessment attempt update failed", error); return NextResponse.json({ error: "Jawaban assessment belum dapat disimpan." }, { status: 503 }); }
}

async function findAttempt(current: Exclude<Awaited<ReturnType<typeof getCurrentAppUser>>, { error: string; status: number }>, attemptId: string) {
  const rows = await current.db.select({ attempt: schema.assessmentAttempts, invitation: schema.assessmentInvitations, template: schema.assessmentTemplates, application: schema.applications, jobOrganizationId: schema.jobs.organizationId }).from(schema.assessmentAttempts).innerJoin(schema.assessmentInvitations, eq(schema.assessmentInvitations.id, schema.assessmentAttempts.invitationId)).innerJoin(schema.assessmentTemplates, eq(schema.assessmentTemplates.id, schema.assessmentInvitations.assessmentTemplateId)).innerJoin(schema.applications, eq(schema.applications.id, schema.assessmentInvitations.applicationId)).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).where(eq(schema.assessmentAttempts.id, attemptId)).limit(1);
  const row = rows[0]; if (!row) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const };
  if (current.user.role === "candidate") { const [profile] = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1); if (!profile || profile.id !== row.invitation.candidateProfileId) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const }; }
  else { const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope || scope.membership.organizationId !== row.jobOrganizationId) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const }; }
  return row;
}
