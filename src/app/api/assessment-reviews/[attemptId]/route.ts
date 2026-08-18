import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { assessmentReviewCreateSchema, assessmentReviewPatchSchema, uuidSchema } from "@/lib/assessment";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

type Current = Exclude<Awaited<ReturnType<typeof getCurrentAppUser>>, { error: string; status: number }>;

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    if (!uuidSchema.safeParse(attemptId).success) return error("ID attempt tidak valid.", 400);
    const current = await getCurrentAppUser();
    if ("error" in current) return error(current.error ?? "Autentikasi diperlukan.", current.status ?? 401);
    const access = await findAccess(current, attemptId);
    if ("error" in access) return error(access.error, access.status);
    const [review] = await current.db.select().from(schema.assessmentReviews).where(eq(schema.assessmentReviews.attemptId, attemptId)).limit(1);
    if (!review) return NextResponse.json({ review: null });
    if (current.user.role === "candidate") {
      return NextResponse.json({ review: { status: review.status, score: review.score, reviewedAt: review.reviewedAt } });
    }
    const questions = await current.db.select().from(schema.assessmentQuestions).where(eq(schema.assessmentQuestions.assessmentTemplateId, (await current.db.select({ id: schema.assessmentInvitations.assessmentTemplateId }).from(schema.assessmentInvitations).where(eq(schema.assessmentInvitations.id, access.invitation.id)).limit(1))[0]?.id ?? "")).orderBy(asc(schema.assessmentQuestions.sortOrder));
    const answers = await current.db.select().from(schema.assessmentAnswers).where(eq(schema.assessmentAnswers.attemptId, attemptId));
    return NextResponse.json({ review, attempt: access.attempt, invitation: access.invitation, questions, answers });
  } catch (cause) {
    console.error("Assessment review read failed", cause);
    return error("Review assessment belum dapat dimuat.", 503);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    if (!uuidSchema.safeParse(attemptId).success) return error("ID attempt tidak valid.", 400);
    const parsed = assessmentReviewCreateSchema.safeParse(await request.json());
    if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Data review tidak valid.", 400);
    const current = await getCurrentAppUser();
    if ("error" in current) return error(current.error ?? "Autentikasi diperlukan.", current.status ?? 401);
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return error(scope.error, scope.status);
    const access = await findRecruiterAccess(current, attemptId, scope.membership.organizationId);
    if ("error" in access) return error(access.error, access.status);
    if (access.attempt.status !== "submitted") return error("Review hanya dapat dibuat setelah attempt dikirim.", 409);
    const result = await current.db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: schema.assessmentReviews.id }).from(schema.assessmentReviews).where(eq(schema.assessmentReviews.attemptId, attemptId)).limit(1);
      if (existing) return { error: "Review untuk attempt ini sudah ada.", status: 409 as const };
       const [review] = await tx.insert(schema.assessmentReviews).values({ attemptId, reviewerId: current.user.id, status: parsed.data.status ?? "pending", score: parsed.data.score ?? null, dimensionScores: parsed.data.dimensionScores ?? {}, notes: parsed.data.notes ?? null, reviewedAt: parsed.data.reviewedAt ? new Date(parsed.data.reviewedAt) : null }).returning();
        await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: scope.membership.organizationId, action: "assessment.review.created", entityType: "assessment_review", entityId: review.id, metadata: { attemptId, status: review.status, hasScore: review.score !== null, hasDimensionScores: Object.keys(review.dimensionScores ?? {}).length > 0 } });
       if (review.status === "completed" || review.status === "disputed") await notifyCandidateReview(tx, access.invitation.id, access.candidateProfileId, attemptId, review.status);
       return { review };
    });
    if ("error" in result) return error(result.error ?? "Review untuk attempt ini sudah ada.", result.status ?? 409);
    return NextResponse.json({ review: result.review }, { status: 201 });
  } catch (cause) {
    console.error("Assessment review create failed", cause);
    return error("Review assessment belum dapat dibuat.", 503);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  try {
    const { attemptId } = await params;
    if (!uuidSchema.safeParse(attemptId).success) return error("ID attempt tidak valid.", 400);
    const parsed = assessmentReviewPatchSchema.safeParse(await request.json());
    if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "Data review tidak valid.", 400);
    const current = await getCurrentAppUser();
    if ("error" in current) return error(current.error ?? "Autentikasi diperlukan.", current.status ?? 401);
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return error(scope.error, scope.status);
    const access = await findRecruiterAccess(current, attemptId, scope.membership.organizationId);
    if ("error" in access) return error(access.error, access.status);
    const { reviewedAt, ...reviewFields } = parsed.data;
     const result = await current.db.transaction(async (tx) => {
       const [previous] = await tx.select({ status: schema.assessmentReviews.status }).from(schema.assessmentReviews).where(and(eq(schema.assessmentReviews.attemptId, attemptId), eq(schema.assessmentReviews.reviewerId, current.user.id))).limit(1);
       if (!previous) return { error: "Review tidak ditemukan atau bukan milik reviewer ini.", status: 404 as const };
       const values = { ...reviewFields, ...(reviewedAt !== undefined ? { reviewedAt: reviewedAt ? new Date(reviewedAt) : null } : {}), updatedAt: new Date() };
       const [review] = await tx.update(schema.assessmentReviews).set(values).where(and(eq(schema.assessmentReviews.attemptId, attemptId), eq(schema.assessmentReviews.reviewerId, current.user.id))).returning();
        if (review) await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: scope.membership.organizationId, action: "assessment.review.updated", entityType: "assessment_review", entityId: review.id, metadata: { attemptId, fromStatus: previous.status, toStatus: review.status, changedFields: Object.keys(reviewFields) } });
       if (review && review.status !== previous.status && (review.status === "completed" || review.status === "disputed")) await notifyCandidateReview(tx, access.invitation.id, access.candidateProfileId, attemptId, review.status);
       return { review };
     });
     if ("error" in result) return error(result.error ?? "Review tidak ditemukan atau bukan milik reviewer ini.", result.status ?? 404);
     const review = result.review;
     if (!review) return error("Review tidak ditemukan atau bukan milik reviewer ini.", 404);
     return NextResponse.json({ review });
  } catch (cause) {
    console.error("Assessment review update failed", cause);
    return error("Review assessment belum dapat diperbarui.", 503);
  }
}

async function findAccess(current: Current, attemptId: string) {
  const [row] = await current.db.select({ attempt: schema.assessmentAttempts, invitation: schema.assessmentInvitations, organizationId: schema.jobs.organizationId, candidateProfileId: schema.assessmentInvitations.candidateProfileId }).from(schema.assessmentAttempts).innerJoin(schema.assessmentInvitations, eq(schema.assessmentInvitations.id, schema.assessmentAttempts.invitationId)).innerJoin(schema.applications, eq(schema.applications.id, schema.assessmentInvitations.applicationId)).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).where(eq(schema.assessmentAttempts.id, attemptId)).limit(1);
  if (!row) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const };
  if (current.user.role === "candidate") {
    const [profile] = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
    if (!profile || profile.id !== row.candidateProfileId) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const };
  } else {
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope || scope.membership.organizationId !== row.organizationId) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const };
  }
  return row;
}

async function findRecruiterAccess(current: Current, attemptId: string, organizationId: string) {
  const access = await findAccess(current, attemptId);
  if ("error" in access || access.organizationId !== organizationId) return { error: "Attempt assessment tidak ditemukan.", status: 404 as const };
  return access;
}

function error(message: string, status: number) { return NextResponse.json({ error: message }, { status }); }

async function notifyCandidateReview(tx: Parameters<Parameters<Current["db"]["transaction"]>[0]>[0], invitationId: string, candidateProfileId: string, attemptId: string, status: "completed" | "disputed") {
  const [candidate] = await tx.select({ userId: schema.candidateProfiles.userId }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.id, candidateProfileId)).limit(1);
  if (!candidate) return;
  const label = status === "completed" ? "selesai" : "memerlukan perhatian";
  await createNotificationWithDeliveries(tx, systemNotification({ userId: candidate.userId, title: `Review assessment ${label}`, body: status === "completed" ? "Review assessment Anda telah selesai." : "Review assessment Anda ditandai untuk ditinjau kembali.", data: notificationData(`assessment-review:${attemptId}:${status}`, `/candidate/assessments/${invitationId}`, { invitationId, attemptId, status }) }));
}
