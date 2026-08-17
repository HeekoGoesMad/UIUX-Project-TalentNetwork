import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema, type Database } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { uuidSchema } from "@/lib/assessment";
import { notificationData, systemNotification } from "@/lib/notifications";

const createSchema = z.object({ applicationId: uuidSchema, assessmentTemplateId: uuidSchema, expiresAt: z.string().datetime({ offset: true }).nullable().optional() }).strict();

export async function GET() {
  try {
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role === "candidate") {
      const [candidate] = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
      if (!candidate) return NextResponse.json({ invitations: [] });
      const invitations = await current.db.select({ invitation: schema.assessmentInvitations, templateName: schema.assessmentTemplates.name }).from(schema.assessmentInvitations).innerJoin(schema.assessmentTemplates, eq(schema.assessmentTemplates.id, schema.assessmentInvitations.assessmentTemplateId)).where(eq(schema.assessmentInvitations.candidateProfileId, candidate.id)).orderBy(desc(schema.assessmentInvitations.createdAt));
      return NextResponse.json({ invitations: await withAttempts(current.db, invitations) });
    }
    const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const invitations = await current.db.select({ invitation: schema.assessmentInvitations, templateName: schema.assessmentTemplates.name, jobTitle: schema.jobs.title, candidateName: schema.profiles.displayName }).from(schema.assessmentInvitations).innerJoin(schema.assessmentTemplates, eq(schema.assessmentTemplates.id, schema.assessmentInvitations.assessmentTemplateId)).innerJoin(schema.applications, eq(schema.applications.id, schema.assessmentInvitations.applicationId)).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.assessmentInvitations.candidateProfileId)).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId)).where(eq(schema.jobs.organizationId, scope.membership.organizationId)).orderBy(desc(schema.assessmentInvitations.createdAt));
    return NextResponse.json({ invitations });
  } catch (error) { console.error("Assessment invitation list failed", error); return NextResponse.json({ error: "Invitation assessment belum dapat dimuat." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invitation assessment tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser(); if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const scope = await getRecruiterScope(current.db, current.user); if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const result = await current.db.transaction(async (tx) => {
       const rows = await tx.select({ application: schema.applications, organizationId: schema.jobs.organizationId, candidateUserId: schema.candidateProfiles.userId }).from(schema.applications).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId)).where(eq(schema.applications.id, parsed.data.applicationId)).limit(1);
      const application = rows[0]; if (!application || application.organizationId !== scope.membership.organizationId) return { error: "Aplikasi tidak ditemukan dalam organisasi recruiter.", status: 404 as const };
      const [template] = await tx.select({ id: schema.assessmentTemplates.id, organizationId: schema.assessmentTemplates.organizationId }).from(schema.assessmentTemplates).where(eq(schema.assessmentTemplates.id, parsed.data.assessmentTemplateId)).limit(1);
      if (!template || template.organizationId !== scope.membership.organizationId) return { error: "Template assessment tidak ditemukan dalam organisasi recruiter.", status: 404 as const };
      const [existing] = await tx.select({ id: schema.assessmentInvitations.id }).from(schema.assessmentInvitations).where(and(eq(schema.assessmentInvitations.applicationId, parsed.data.applicationId), eq(schema.assessmentInvitations.assessmentTemplateId, parsed.data.assessmentTemplateId), eq(schema.assessmentInvitations.status, "pending"))).limit(1);
      if (existing) return { error: "Invitation untuk aplikasi dan template ini sudah aktif.", status: 409 as const };
       const [invitation] = await tx.insert(schema.assessmentInvitations).values({ applicationId: parsed.data.applicationId, assessmentTemplateId: parsed.data.assessmentTemplateId, candidateProfileId: application.application.candidateProfileId, invitedBy: current.user.id, expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null }).returning();
       await tx.insert(schema.notifications).values([systemNotification({ userId: application.candidateUserId, title: "Invitation assessment baru", body: "Anda menerima invitation assessment baru dari recruiter.", data: notificationData(`assessment-invitation:${invitation.id}:created`, `/candidate/assessments/${invitation.id}`, { invitationId: invitation.id, status: "pending" }) })]);
       return { invitation };
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { console.error("Assessment invitation create failed", error); return NextResponse.json({ error: "Invitation assessment belum dapat dibuat." }, { status: 503 }); }
}

async function withAttempts(db: Database, rows: Array<{ invitation: typeof schema.assessmentInvitations.$inferSelect; templateName: string }>) {
  return Promise.all(rows.map(async (row) => { const [attempt] = await db.select({ id: schema.assessmentAttempts.id, status: schema.assessmentAttempts.status }).from(schema.assessmentAttempts).where(eq(schema.assessmentAttempts.invitationId, row.invitation.id)).orderBy(desc(schema.assessmentAttempts.attemptNumber)).limit(1); return { ...row.invitation, templateName: row.templateName, attempt: attempt ?? null }; }));
}
