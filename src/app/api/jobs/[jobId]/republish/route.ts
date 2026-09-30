import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { ShortlistService } from "@/lib/services/shortlist";
import { writeAuditLog } from "@/lib/audit";

export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error ?? "Autentikasi diperlukan." }, { status: current.status });
    }
    if (current.user.role !== "recruiter") {
      return NextResponse.json({ error: "Hanya recruiter yang dapat mempublikasikan ulang lowongan." }, { status: 403 });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) {
      return NextResponse.json({ error: scope.error ?? "Akses recruiter tidak valid." }, { status: scope.status });
    }

    const { jobId } = await params;
    const organizationId = scope.membership.organizationId;

    // 1. Fetch old job
    const [oldJob] = await current.db
      .select()
      .from(schema.jobs)
      .where(and(eq(schema.jobs.id, jobId), eq(schema.jobs.organizationId, organizationId)))
      .limit(1);

    if (!oldJob) {
      return NextResponse.json({ error: "Lowongan tidak ditemukan." }, { status: 404 });
    }

    if (oldJob.status !== "closed" && oldJob.status !== "archived") {
      return NextResponse.json(
        { error: "Hanya lowongan berstatus 'closed' atau 'archived' yang dapat dipublikasikan ulang." },
        { status: 409 }
      );
    }

    // 2. Fetch existing requirements
    const oldRequirements = await current.db
      .select()
      .from(schema.jobRequirements)
      .where(eq(schema.jobRequirements.jobId, oldJob.id));

    // 3. Find candidates from old applications to migrate to Talent Pool
    const existingApplications = await current.db
      .select({
        id: schema.applications.id,
        candidateProfileId: schema.applications.candidateProfileId,
        status: schema.applications.status,
      })
      .from(schema.applications)
      .where(eq(schema.applications.jobId, oldJob.id));

    let candidatesMovedCount = 0;
    if (existingApplications.length > 0) {
      const defaultList = await ShortlistService.ensureDefault(current.db, organizationId, current.user.id);
      for (const app of existingApplications) {
        try {
          if (defaultList?.id) {
            await ShortlistService.addItem(current.db, {
              organizationId,
              createdBy: current.user.id,
              candidateProfileId: app.candidateProfileId,
              shortlistId: defaultList.id,
              notes: `Dipindahkan ke Talent Pool dari lowongan: ${oldJob.title} (Batch Baru diterbitkan)`,
            });
            candidatesMovedCount++;
          }
        } catch {
          // If already in shortlist, continue safely
        }
      }
    }

    // 4. Archive the old job
    const now = new Date();
    await current.db
      .update(schema.jobs)
      .set({
        status: "archived",
        updatedAt: now,
      })
      .where(eq(schema.jobs.id, oldJob.id));

    // 5. Create cloned job with same title, fresh 30-day window, published status, empty pipeline
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [newJob] = await current.db
      .insert(schema.jobs)
      .values({
        organizationId,
        createdBy: current.user.id,
        title: oldJob.title,
        description: oldJob.description,
        employmentType: oldJob.employmentType,
        workArrangement: oldJob.workArrangement,
        location: oldJob.location,
        salaryMin: oldJob.salaryMin,
        salaryMax: oldJob.salaryMax,
        salaryCurrency: oldJob.salaryCurrency,
        salaryPeriod: oldJob.salaryPeriod,
        isSalaryNegotiable: oldJob.isSalaryNegotiable,
        hideSalary: oldJob.hideSalary,
        experienceLevel: oldJob.experienceLevel,
        minEducation: oldJob.minEducation,
        jobCategory: oldJob.jobCategory,
        responsibilities: oldJob.responsibilities,
        qualifications: oldJob.qualifications,
        benefits: oldJob.benefits,
        vacanciesCount: oldJob.vacanciesCount,
        status: "published",
        publishedAt: now,
        expiresAt,
        closedAt: null,
      })
      .returning();

    // 6. Copy requirements to the new job
    const newRequirements = oldRequirements.map((req) => ({
      jobId: newJob.id,
      name: req.name,
      type: req.type,
      description: req.description,
      minimumExperienceMonths: req.minimumExperienceMonths,
    }));

    if (newRequirements.length > 0) {
      await current.db.insert(schema.jobRequirements).values(newRequirements);
    }

    // 7. Audit log
    await writeAuditLog({
      db: current.db,
      actorUserId: current.user.id,
      action: "recruiter.job.republished",
      entityType: "job",
      entityId: newJob.id,
      metadata: {
        oldJobId: oldJob.id,
        newJobId: newJob.id,
        title: newJob.title,
        candidatesMovedCount,
      },
    });

    return NextResponse.json(
      {
        message: "Lowongan berhasil dipublikasikan ulang sebagai batch baru.",
        job: { ...newJob, requirements: newRequirements },
        oldJobId: oldJob.id,
        candidatesMovedCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/jobs/[jobId]/republish Error]:", error);
    return NextResponse.json({ error: "Gagal mempublikasikan ulang lowongan." }, { status: 500 });
  }
}
