import { and, asc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { notificationData, systemNotification } from "@/lib/notifications";
type CurrentUser = Exclude<Awaited<ReturnType<typeof getCurrentAppUser>>, { error: string; status: number }>;
type ParticipantRow = { application: typeof schema.applications.$inferSelect; jobTitle: string; organizationName: string; candidateName: string | null; candidateHeadline: string | null; candidateLocation: string | null; candidateUserId: string };

const statusValues = ["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review", "interview", "offer", "hired", "rejected", "withdrawn"] as const;
const updateSchema = z.object({ status: z.enum(statusValues), reason: z.string().trim().min(3).max(1000).optional() }).strict();
const idSchema = z.string().uuid();
const recruiterTransitions: Record<(typeof statusValues)[number], (typeof statusValues)[number][]> = {
  new: ["shortlisted", "rejected"], shortlisted: ["consent_requested", "screening", "rejected"], consent_requested: ["consent_approved", "rejected"], consent_approved: ["screening", "rejected"], screening: ["assessment", "review", "rejected"], assessment: ["review", "interview", "rejected"], review: ["interview", "offer", "rejected"], interview: ["offer", "hired", "rejected"], offer: ["hired", "rejected"], hired: [], rejected: [], withdrawn: [],
};

export async function GET(_request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const { applicationId } = await params;
    if (!idSchema.safeParse(applicationId).success) return NextResponse.json({ error: "ID aplikasi tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const application = await findParticipant(current, applicationId);
    if ("error" in application) return NextResponse.json({ error: application.error }, { status: application.status });
    const history = await current.db.select().from(schema.applicationStageHistory).where(eq(schema.applicationStageHistory.applicationId, application.application.id)).orderBy(asc(schema.applicationStageHistory.createdAt));
    return NextResponse.json({ application: application.value, history });
  } catch (error) { console.error("Application detail failed", error); return NextResponse.json({ error: "Detail aplikasi belum dapat dimuat." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const { applicationId } = await params;
    if (!idSchema.safeParse(applicationId).success) return NextResponse.json({ error: "ID aplikasi tidak valid." }, { status: 400 });
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Perubahan status tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const participant = await findParticipant(current, applicationId);
    if ("error" in participant) return NextResponse.json({ error: participant.error }, { status: participant.status });
    const currentStatus = participant.application.status;
    if (current.user.role === "candidate") {
      if (parsed.data.status !== "withdrawn" || !["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review", "interview", "offer"].includes(currentStatus)) return NextResponse.json({ error: "Lamaran tidak dapat ditarik pada tahap ini." }, { status: 409 });
    } else {
      if (!recruiterTransitions[currentStatus].includes(parsed.data.status)) return NextResponse.json({ error: `Transisi ${currentStatus} ke ${parsed.data.status} tidak diizinkan.` }, { status: 409 });
    }
    const now = new Date();
    const updated = await current.db.transaction(async (tx) => {
       const [next] = await tx.update(schema.applications).set({ status: parsed.data.status, withdrawnAt: parsed.data.status === "withdrawn" ? now : participant.application.withdrawnAt, updatedAt: now }).where(eq(schema.applications.id, applicationId)).returning();
       await tx.insert(schema.applicationStageHistory).values({ applicationId, fromStatus: currentStatus, toStatus: parsed.data.status, changedBy: current.user.id, reason: parsed.data.reason ?? null });
       if (current.user.role === "candidate") {
         const recipients = await tx.select({ userId: schema.organizationMembers.userId }).from(schema.organizationMembers)
           .innerJoin(schema.users, eq(schema.users.id, schema.organizationMembers.userId))
           .innerJoin(schema.jobs, eq(schema.jobs.organizationId, schema.organizationMembers.organizationId))
           .where(and(eq(schema.jobs.id, participant.application.jobId), or(inArray(schema.organizationMembers.role, ["owner", "admin"]), and(eq(schema.organizationMembers.role, "recruiter"), eq(schema.users.recruiterProvisioningStatus, "active")))));
         if (recipients.length) await tx.insert(schema.notifications).values(recipients.map(({ userId }) => systemNotification({ userId, title: "Kandidat menarik lamaran", body: `${participant.value.candidate.name ?? "Kandidat"} menarik lamaran untuk ${participant.value.job.title}.`, data: notificationData(`application:${applicationId}:withdrawn`, `/recruiter/applications/${applicationId}`, { applicationId, status: "withdrawn" }) })));
       } else {
         await tx.insert(schema.notifications).values([systemNotification({ userId: participant.candidateUserId, title: `Status lamaran: ${parsed.data.status}`, body: `Status lamaran untuk ${participant.value.job.title} berubah menjadi ${parsed.data.status}.`, data: notificationData(`application:${applicationId}:stage:${parsed.data.status}`, `/candidate/applications/${applicationId}`, { applicationId, status: parsed.data.status }) })]);
       }
       return next;
    });
    return NextResponse.json({ application: updated });
  } catch (error) { console.error("Application update failed", error); return NextResponse.json({ error: "Status aplikasi belum dapat diubah." }, { status: 503 }); }
}

async function findParticipant(current: CurrentUser, applicationId: string): Promise<(ParticipantRow & { value: ParticipantRow["application"] & { job: { id: string; title: string; organizationName: string }; candidate: { name: string | null; headline: string | null; location: string | null } } }) | { error: string; status: 404 | 403 }> {
  const rows = await current.db.select({ application: schema.applications, jobTitle: schema.jobs.title, organizationName: schema.organizations.name, candidateName: schema.profiles.displayName, candidateHeadline: schema.candidateProfiles.headline, candidateLocation: schema.candidateProfiles.location, candidateUserId: schema.candidateProfiles.userId }).from(schema.applications).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId)).innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId)).leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId)).where(eq(schema.applications.id, applicationId)).limit(1);
  const row: ParticipantRow | undefined = rows[0];
  if (!row) return { error: "Aplikasi tidak ditemukan.", status: 404 as const };
  if (current.user.role === "candidate") {
    if (row.candidateUserId !== current.user.id) return { error: "Aplikasi tidak ditemukan.", status: 404 as const };
  } else {
    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return scope;
    const [owned] = await current.db.select({ id: schema.jobs.id }).from(schema.jobs).where(and(eq(schema.jobs.id, row.application.jobId), eq(schema.jobs.organizationId, scope.membership.organizationId))).limit(1);
    if (!owned) return { error: "Aplikasi tidak ditemukan.", status: 404 as const };
  }
  return { ...row, value: { ...row.application, job: { id: row.application.jobId, title: row.jobTitle, organizationName: row.organizationName }, candidate: { name: row.candidateName, headline: row.candidateHeadline, location: row.candidateLocation } } };
}
