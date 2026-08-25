import { and, desc, eq, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

const uuid = z.string().uuid();
const createSchema = z.object({
  jobId: uuid,
  coverNote: z.string().trim().min(20, "Cover note minimal 20 karakter.").max(4000, "Cover note maksimal 4.000 karakter."),
}).strict();

const applicationSelect = {
  application: schema.applications,
  jobTitle: schema.jobs.title,
  organizationName: schema.organizations.name,
  candidateName: schema.profiles.displayName,
  candidateHeadline: schema.candidateProfiles.headline,
  candidateLocation: schema.candidateProfiles.location,
};
type ApplicationRow = { application: typeof schema.applications.$inferSelect; jobTitle: string; organizationName: string; candidateName: string | null; candidateHeadline: string | null; candidateLocation: string | null };

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    if (current.user.role === "candidate") {
      const profile = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
      if (!profile[0]) return NextResponse.json({ applications: [] });
      const rows = await current.db.select(applicationSelect).from(schema.applications)
        .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
        .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
        .leftJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
        .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
        .where(eq(schema.applications.candidateProfileId, profile[0].id)).orderBy(desc(schema.applications.updatedAt));
      return NextResponse.json({ applications: rows.map(formatApplication) });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) return NextResponse.json({ error: scope.error }, { status: scope.status });
    const rows = await current.db.select(applicationSelect).from(schema.applications)
      .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
      .leftJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.jobs.organizationId, scope.membership.organizationId)).orderBy(desc(schema.applications.updatedAt));
    return NextResponse.json({ applications: rows.map(formatApplication) });
  } catch (error) {
    console.error("Application list failed", error);
    return NextResponse.json({ error: "Aplikasi belum dapat dimuat." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data aplikasi tidak valid." }, { status: 400 });
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    if (current.user.role !== "candidate") return NextResponse.json({ error: "Hanya kandidat yang dapat melamar." }, { status: 403 });

    const [candidate] = await current.db.select({ id: schema.candidateProfiles.id }).from(schema.candidateProfiles).where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
    if (!candidate) return NextResponse.json({ error: "Lengkapi profil kandidat sebelum melamar." }, { status: 409 });
     const [job] = await current.db.select({ id: schema.jobs.id, status: schema.jobs.status, organizationId: schema.jobs.organizationId, title: schema.jobs.title }).from(schema.jobs).where(eq(schema.jobs.id, parsed.data.jobId)).limit(1);
    if (!job || job.status !== "published") return NextResponse.json({ error: "Job tidak tersedia untuk lamaran." }, { status: 404 });
    const [duplicate] = await current.db.select({ id: schema.applications.id }).from(schema.applications).where(and(eq(schema.applications.jobId, job.id), eq(schema.applications.candidateProfileId, candidate.id))).limit(1);
    if (duplicate) return NextResponse.json({ error: "Anda sudah melamar job ini." }, { status: 409 });

    const result = await current.db.transaction(async (tx) => {
       const [application] = await tx.insert(schema.applications).values({ jobId: job.id, candidateProfileId: candidate.id, coverNote: parsed.data.coverNote }).returning();
        await tx.insert(schema.applicationStageHistory).values({ applicationId: application.id, fromStatus: null, toStatus: "new", changedBy: current.user.id, reason: "Lamaran dikirim kandidat." });
        await writeAuditLog({ db: tx, actorUserId: current.user.id, organizationId: job.organizationId, action: "application.created", entityType: "application", entityId: application.id, metadata: { jobId: job.id, candidateProfileId: candidate.id, source: application.source } });
       const recipients = await tx.select({ userId: schema.organizationMembers.userId }).from(schema.organizationMembers)
         .innerJoin(schema.users, eq(schema.users.id, schema.organizationMembers.userId))
         .where(and(eq(schema.organizationMembers.organizationId, job.organizationId), or(inArray(schema.organizationMembers.role, ["owner", "admin"]), and(eq(schema.organizationMembers.role, "recruiter"), eq(schema.users.recruiterProvisioningStatus, "active")))));
        await Promise.all(recipients.map(({ userId }) => createNotificationWithDeliveries(tx, systemNotification({
         userId,
         title: "Lamaran baru masuk",
         body: `Kandidat mengirim lamaran untuk ${job.title}.`,
         data: notificationData(`application:${application.id}:submitted`, `/recruiter/applications/${application.id}`, { applicationId: application.id, jobId: job.id }),
        }))));
       return application;
    });
    return NextResponse.json({ application: result }, { status: 201 });
  } catch (error) {
    console.error("Application create failed", error);
    return NextResponse.json({ error: "Lamaran belum dapat dikirim." }, { status: 503 });
  }
}

function formatApplication(row: ApplicationRow) {
  return {
    ...row.application,
    job: { id: row.application.jobId, title: row.jobTitle, organizationName: row.organizationName },
    candidate: row.candidateName || row.candidateHeadline ? { name: row.candidateName, headline: row.candidateHeadline, location: row.candidateLocation } : null,
  };
}
