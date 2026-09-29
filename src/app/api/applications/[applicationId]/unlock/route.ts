import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { schema } from "@/db";
import { getCurrentAppUser, getRecruiterScope } from "@/lib/api/auth";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import { ScreeningService } from "@/lib/services/screening";

const idSchema = z.string().uuid();

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const { applicationId } = await params;
    if (!idSchema.safeParse(applicationId).success) {
      return NextResponse.json({ error: "ID aplikasi tidak valid." }, { status: 400 });
    }

    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const scope = await getRecruiterScope(current.db, current.user);
    if ("error" in scope) {
      return NextResponse.json({ error: scope.error }, { status: scope.status });
    }

    const organizationId = scope.membership.organizationId;

    // 1. Fetch application, job, and candidate
    const [row] = await current.db
      .select({
        application: schema.applications,
        jobTitle: schema.jobs.title,
        jobOrganizationId: schema.jobs.organizationId,
        organizationName: schema.organizations.name,
        candidateProfileId: schema.candidateProfiles.id,
        candidateUserId: schema.candidateProfiles.userId,
        candidateName: schema.profiles.displayName,
      })
      .from(schema.applications)
      .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
      .innerJoin(schema.organizations, eq(schema.organizations.id, schema.jobs.organizationId))
      .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(
        and(
          eq(schema.applications.id, applicationId),
          eq(schema.jobs.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: "Aplikasi tidak ditemukan atau tidak memiliki hak akses." },
        { status: 404 }
      );
    }

    // 2. Check if already unlocked
    if (row.application.unlockedAt) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        application: row.application,
      });
    }

    // 3. Deduct token & create screening run if not already screened
    const idempotencyKey = `${organizationId}:app-unlock:${applicationId}`;
    const screenResult = await ScreeningService.startRun(current.db, current.user, scope, {
      candidateProfileId: row.candidateProfileId,
      idempotencyKey,
    });

    if ("error" in screenResult) {
      return NextResponse.json(
        { error: screenResult.error },
        { status: screenResult.status }
      );
    }

    // Non-blocking trigger AI background evaluation
    if (screenResult.runId) {
      ScreeningService.executeRunResult(
        current.db,
        current.user,
        scope,
        screenResult.runId
      ).catch((err) => console.error("[Inbound Unlock AI Background Error]:", err));
    }

    // 4. Update application status to 'screening' and record unlockedAt
    const now = new Date();
    const updatedApplication = await current.db.transaction(async (tx) => {
      const [nextApp] = await tx
        .update(schema.applications)
        .set({
          unlockedAt: now,
          status: "screening",
          updatedAt: now,
        })
        .where(eq(schema.applications.id, applicationId))
        .returning();

      await tx.insert(schema.applicationStageHistory).values({
        applicationId,
        fromStatus: row.application.status,
        toStatus: "screening",
        changedBy: current.user.id,
        reason: "Profil pelamar dibuka oleh rekruter (1 Token konsumsi).",
      });

      await writeAuditLog({
        db: tx,
        actorUserId: current.user.id,
        organizationId,
        action: "application.unlocked",
        entityType: "application",
        entityId: applicationId,
        metadata: {
          candidateProfileId: row.candidateProfileId,
          jobId: row.application.jobId,
          runId: screenResult.runId,
          tokenCost: 1,
        },
      });

      // Dispatch notification to candidate
      await createNotificationWithDeliveries(
        tx,
        systemNotification({
          userId: row.candidateUserId,
          title: "Profil & Berkas Lamaran Sedang Ditinjau",
          body: `Tim rekruter dari ${row.organizationName} telah membuka profil Anda untuk posisi ${row.jobTitle}.`,
          data: notificationData(
            `application:${applicationId}:unlocked:${row.candidateUserId}`,
            `/candidate/applications/${applicationId}`,
            { applicationId, status: "screening" }
          ),
        })
      );

      return nextApp;
    });

    return NextResponse.json({
      success: true,
      alreadyUnlocked: false,
      application: updatedApplication,
      runId: screenResult.runId,
    });
  } catch (error) {
    console.error("[Inbound Unlock Error]:", error);
    return NextResponse.json(
      { error: "Gagal membuka profil pelamar." },
      { status: 500 }
    );
  }
}
