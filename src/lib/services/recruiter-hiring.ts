import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { writeAuditLog } from "@/lib/audit";
import { createNotificationWithDeliveries, notificationData, systemNotification } from "@/lib/notifications";

export type ScheduleInterviewInput = {
  applicationId?: string;
  candidateProfileId?: string;
  jobId?: string;
  organizationId: string;
  recruiterUserId: string;
  title: string;
  scheduledAt: Date;
  durationMinutes?: number;
  timezone?: string;
  meetingUrl?: string;
  panelMemberUserIds?: string[];
  criteria?: Record<string, unknown>;
};

export type UpdateInterviewInput = {
  interviewId: string;
  organizationId: string;
  actorUserId: string;
  status?: "scheduled" | "completed" | "cancelled" | "rescheduled";
  scheduledAt?: Date;
  durationMinutes?: number;
  timezone?: string;
  meetingUrl?: string;
  reason?: string;
};

export type SubmitInterviewFeedbackInput = {
  interviewId: string;
  reviewerUserId: string;
  recommendation?: "strong_yes" | "yes" | "mixed" | "no" | "strong_no";
  overallScore?: number;
  comments?: string;
  ratings?: Record<string, unknown>;
};

export type CreateOfferInput = {
  applicationId?: string;
  candidateProfileId?: string;
  jobId?: string;
  organizationId: string;
  recruiterUserId: string;
  status?: "draft" | "sent";
  terms: {
    salary: string;
    currency?: string;
    benefits?: string;
    employmentType?: string;
    startDate?: string;
    notes?: string;
  };
  expiresAt?: Date | null;
};

export type RespondToOfferInput = {
  offerId: string;
  status: "accepted" | "declined";
  actorUserId: string;
  isCandidate: boolean;
  reason?: string;
};

export async function listInterviewsForOrganization(
  db: Database,
  organizationId: string,
  options?: { applicationId?: string; limit?: number }
) {
  const conditions = [eq(schema.interviews.organizationId, organizationId)];
  if (options?.applicationId) {
    conditions.push(eq(schema.interviews.applicationId, options.applicationId));
  }

  const rows = await db
    .select({
      interview: schema.interviews,
      jobId: schema.jobs.id,
      jobTitle: schema.jobs.title,
      candidateProfileId: schema.candidateProfiles.id,
      candidateName: schema.profiles.displayName,
      candidateEmail: schema.users.email,
      applicationStatus: schema.applications.status,
    })
    .from(schema.interviews)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.interviews.applicationId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .innerJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(schema.interviews.scheduledAt))
    .limit(options?.limit ?? 50);

  return rows;
}

export async function getInterviewById(db: Database, interviewId: string, organizationId?: string) {
  const conditions = [eq(schema.interviews.id, interviewId)];
  if (organizationId) {
    conditions.push(eq(schema.interviews.organizationId, organizationId));
  }

  const [row] = await db
    .select({
      interview: schema.interviews,
      application: schema.applications,
      job: schema.jobs,
      candidateProfile: schema.candidateProfiles,
      candidateProfileInfo: schema.profiles,
      candidateUser: schema.users,
    })
    .from(schema.interviews)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.interviews.applicationId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .innerJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(and(...conditions))
    .limit(1);

  if (!row) return null;

  const [panelMembers, scorecards] = await Promise.all([
    db
      .select({
        id: schema.interviewPanelMembers.id,
        userId: schema.interviewPanelMembers.userId,
        role: schema.interviewPanelMembers.role,
        name: schema.profiles.displayName,
        email: schema.users.email,
      })
      .from(schema.interviewPanelMembers)
      .innerJoin(schema.users, eq(schema.users.id, schema.interviewPanelMembers.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.interviewPanelMembers.userId))
      .where(eq(schema.interviewPanelMembers.interviewId, interviewId)),
    db
      .select({
        scorecard: schema.interviewScorecards,
        feedback: schema.interviewFeedback,
      })
      .from(schema.interviewScorecards)
      .leftJoin(schema.interviewFeedback, eq(schema.interviewFeedback.scorecardId, schema.interviewScorecards.id))
      .where(eq(schema.interviewScorecards.interviewId, interviewId)),
  ]);

  return {
    ...row,
    panelMembers,
    scorecards,
  };
}

export async function findOrCreateApplicationForCandidate(
  db: Database,
  input: {
    candidateProfileId: string;
    organizationId: string;
    recruiterUserId: string;
    jobId?: string;
  }
) {
  const [existing] = await db
    .select({
      id: schema.applications.id,
      jobId: schema.applications.jobId,
      status: schema.applications.status,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .where(
      and(
        eq(schema.applications.candidateProfileId, input.candidateProfileId),
        eq(schema.jobs.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (existing) return existing;

  let targetJobId = input.jobId;
  if (!targetJobId) {
    const [firstJob] = await db
      .select({ id: schema.jobs.id })
      .from(schema.jobs)
      .where(eq(schema.jobs.organizationId, input.organizationId))
      .limit(1);

    if (firstJob) {
      targetJobId = firstJob.id;
    } else {
      const [newJob] = await db
        .insert(schema.jobs)
        .values({
          organizationId: input.organizationId,
          createdBy: input.recruiterUserId,
          title: "Talent Network Candidate",
          description: "Posisi yang dibuka untuk kandidat dari ProofyLink Talent Network.",
          employmentType: "full_time",
          workArrangement: "remote",
          status: "published",
        })
        .returning();
      targetJobId = newJob.id;
    }
  }

  const [created] = await db
    .insert(schema.applications)
    .values({
      jobId: targetJobId,
      candidateProfileId: input.candidateProfileId,
      status: "screening",
      source: "recruiter_invitation",
      coverNote: "Kandidat diundang langsung oleh rekruter melalui Talent Network.",
    })
    .returning();

  return created;
}

async function sendSystemHiringMessage(
  tx: Database,
  input: {
    organizationId: string;
    recruiterUserId: string;
    candidateUserId: string;
    body: string;
  }
) {
  try {
    const existing = await tx
      .select({ id: schema.conversations.id })
      .from(schema.conversations)
      .innerJoin(
        schema.conversationParticipants,
        eq(schema.conversationParticipants.conversationId, schema.conversations.id)
      )
      .where(
        and(
          eq(schema.conversations.organizationId, input.organizationId),
          eq(schema.conversationParticipants.userId, input.candidateUserId),
          eq(schema.conversations.status, "active")
        )
      )
      .limit(1);

    let conversationId = existing[0]?.id;

    if (!conversationId) {
      const [newConv] = await tx
        .insert(schema.conversations)
        .values({
          organizationId: input.organizationId,
          createdBy: input.recruiterUserId,
          status: "active",
        })
        .returning();
      conversationId = newConv.id;

      await tx.insert(schema.conversationParticipants).values([
        { conversationId, userId: input.recruiterUserId },
        { conversationId, userId: input.candidateUserId },
      ]);
    }

    await tx.insert(schema.messages).values({
      conversationId,
      senderId: input.recruiterUserId,
      body: input.body,
    });

    await tx
      .update(schema.conversations)
      .set({ updatedAt: new Date() })
      .where(eq(schema.conversations.id, conversationId));
  } catch (err) {
    console.error("Failed to send hiring message:", err);
  }
}

export async function scheduleInterview(db: Database, input: ScheduleInterviewInput) {
  let targetAppId = input.applicationId;
  if (!targetAppId && input.candidateProfileId) {
    const resolved = await findOrCreateApplicationForCandidate(db, {
      candidateProfileId: input.candidateProfileId,
      organizationId: input.organizationId,
      recruiterUserId: input.recruiterUserId,
      jobId: input.jobId,
    });
    targetAppId = resolved.id;
  }

  if (!targetAppId) {
    throw new Error("applicationId atau candidateProfileId wajib diberikan.");
  }

  // Validate ownership
  const [appRow] = await db
    .select({
      application: schema.applications,
      jobTitle: schema.jobs.title,
      candidateUserId: schema.candidateProfiles.userId,
      candidateName: schema.profiles.displayName,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(
      and(
        eq(schema.applications.id, targetAppId),
        eq(schema.jobs.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!appRow) {
    throw new Error("Lamaran tidak ditemukan atau bukan milik organisasi Anda.");
  }

  return await db.transaction(async (tx) => {
    // 1. Insert interview
    const [interview] = await tx
      .insert(schema.interviews)
      .values({
        applicationId: targetAppId,
        organizationId: input.organizationId,
        createdBy: input.recruiterUserId,
        title: input.title,
        status: "scheduled",
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes ?? 45,
        timezone: input.timezone ?? "Asia/Jakarta (WIB)",
        meetingUrl: input.meetingUrl ?? null,
      })
      .returning();

    // 2. Insert panel members
    if (input.panelMemberUserIds && input.panelMemberUserIds.length > 0) {
      await tx
        .insert(schema.interviewPanelMembers)
        .values(
          input.panelMemberUserIds.map((userId) => ({
            interviewId: interview.id,
            userId,
            role: "interviewer" as const,
          }))
        )
        .onConflictDoNothing();
    }

    // 3. Update application status to "interview" if currently in earlier stage
    const currentStatus = appRow.application.status;
    if (["new", "shortlisted", "consent_requested", "consent_approved", "screening", "assessment", "review"].includes(currentStatus)) {
      await tx
        .update(schema.applications)
        .set({ status: "interview", updatedAt: new Date() })
        .where(eq(schema.applications.id, targetAppId));

      await tx.insert(schema.applicationStageHistory).values({
        applicationId: targetAppId,
        fromStatus: currentStatus,
        toStatus: "interview",
        changedBy: input.recruiterUserId,
        reason: "Wawancara dijadwalkan.",
      });
    }

    // 4. Create interview event
    await tx.insert(schema.interviewEvents).values({
      interviewId: interview.id,
      actorUserId: input.recruiterUserId,
      type: "created",
      metadata: { scheduledAt: input.scheduledAt.toISOString(), meetingUrl: input.meetingUrl },
    });

    // 5. Notify candidate (in-app + external email)
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(input.scheduledAt);

    await createNotificationWithDeliveries(
      tx,
      systemNotification({
        userId: appRow.candidateUserId,
        title: `Undangan Wawancara: ${appRow.jobTitle}`,
        body: `Wawancara dijadwalkan pada ${formattedDate} (${input.timezone ?? "WIB"}).${input.meetingUrl ? ` Link: ${input.meetingUrl}` : ""}`,
        data: notificationData(
          `interview:${interview.id}:scheduled`,
          `/candidate/applications/${targetAppId}`,
          { interviewId: interview.id, applicationId: targetAppId }
        ),
      })
    );

    // 6. Send in-app chat message into /messages
    await sendSystemHiringMessage(tx, {
      organizationId: input.organizationId,
      recruiterUserId: input.recruiterUserId,
      candidateUserId: appRow.candidateUserId,
      body: `📅 Undangan Wawancara: ${appRow.jobTitle}\nJadwal: ${formattedDate} (${input.timezone ?? "WIB"})\nTautan Meeting: ${input.meetingUrl ?? "Google Meet / Tautan akan dibagikan"}\n\nSilakan tinjau jadwal ini pada detail lamaran Anda dan unduh berkas kalender (.ics).`,
    });

    // 7. Audit log
    await writeAuditLog({
      db: tx,
      actorUserId: input.recruiterUserId,
      organizationId: input.organizationId,
      action: "interview.scheduled",
      entityType: "interview",
      entityId: interview.id,
      metadata: { applicationId: targetAppId, scheduledAt: input.scheduledAt },
    });

    return interview;
  });
}

export async function updateInterview(db: Database, input: UpdateInterviewInput) {
  const [interview] = await db
    .select()
    .from(schema.interviews)
    .where(
      and(
        eq(schema.interviews.id, input.interviewId),
        eq(schema.interviews.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!interview) {
    throw new Error("Wawancara tidak ditemukan.");
  }

  return await db.transaction(async (tx) => {
    const updatePayload: Partial<typeof schema.interviews.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.status) updatePayload.status = input.status;
    if (input.scheduledAt) updatePayload.scheduledAt = input.scheduledAt;
    if (input.durationMinutes !== undefined) updatePayload.durationMinutes = input.durationMinutes;
    if (input.timezone) updatePayload.timezone = input.timezone;
    if (input.meetingUrl !== undefined) updatePayload.meetingUrl = input.meetingUrl;

    const [updated] = await tx
      .update(schema.interviews)
      .set(updatePayload)
      .where(eq(schema.interviews.id, input.interviewId))
      .returning();

    // Event type
    const eventType = input.status === "cancelled"
      ? "cancelled"
      : input.status === "completed"
      ? "completed"
      : input.scheduledAt
      ? "rescheduled"
      : "updated";

    await tx.insert(schema.interviewEvents).values({
      interviewId: input.interviewId,
      actorUserId: input.actorUserId,
      type: eventType,
      metadata: { reason: input.reason, ...updatePayload },
    });

    // Notify candidate if cancelled or rescheduled
    if (eventType === "cancelled" || eventType === "rescheduled") {
      const [appRow] = await tx
        .select({
          candidateUserId: schema.candidateProfiles.userId,
          jobTitle: schema.jobs.title,
        })
        .from(schema.applications)
        .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
        .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
        .where(eq(schema.applications.id, interview.applicationId))
        .limit(1);

      if (appRow) {
        const title = eventType === "cancelled"
          ? `Wawancara Dibatalkan: ${appRow.jobTitle}`
          : `Jadwal Wawancara Diperbarui: ${appRow.jobTitle}`;

        await createNotificationWithDeliveries(
          tx,
          systemNotification({
            userId: appRow.candidateUserId,
            title,
            body: input.reason || `Jadwal wawancara Anda telah diperbarui oleh rekruter.`,
            data: notificationData(
              `interview:${interview.id}:${eventType}:${Date.now()}`,
              `/candidate/applications/${interview.applicationId}`,
              { interviewId: interview.id, eventType }
            ),
          })
        );
      }
    }

    return updated;
  });
}

export async function submitInterviewFeedback(db: Database, input: SubmitInterviewFeedbackInput) {
  return await db.transaction(async (tx) => {
    // 1. Get or create interview panel member
    let [panelMember] = await tx
      .select()
      .from(schema.interviewPanelMembers)
      .where(
        and(
          eq(schema.interviewPanelMembers.interviewId, input.interviewId),
          eq(schema.interviewPanelMembers.userId, input.reviewerUserId)
        )
      )
      .limit(1);

    if (!panelMember) {
      [panelMember] = await tx
        .insert(schema.interviewPanelMembers)
        .values({
          interviewId: input.interviewId,
          userId: input.reviewerUserId,
          role: "interviewer",
        })
        .returning();
    }

    // 2. Get or create scorecard
    let [scorecard] = await tx
      .select()
      .from(schema.interviewScorecards)
      .where(
        and(
          eq(schema.interviewScorecards.interviewId, input.interviewId),
          eq(schema.interviewScorecards.panelMemberId, panelMember.id)
        )
      )
      .limit(1);

    if (!scorecard) {
      [scorecard] = await tx
        .insert(schema.interviewScorecards)
        .values({
          interviewId: input.interviewId,
          panelMemberId: panelMember.id,
          criteria: input.ratings ?? {},
          submittedAt: new Date(),
        })
        .returning();
    } else {
      [scorecard] = await tx
        .update(schema.interviewScorecards)
        .set({
          criteria: input.ratings ?? {},
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.interviewScorecards.id, scorecard.id))
        .returning();
    }

    // 3. Upsert feedback
    const [feedback] = await tx
      .insert(schema.interviewFeedback)
      .values({
        scorecardId: scorecard.id,
        recommendation: input.recommendation,
        overallScore: input.overallScore,
        comments: input.comments,
        ratings: input.ratings ?? {},
      })
      .onConflictDoUpdate({
        target: schema.interviewFeedback.scorecardId,
        set: {
          recommendation: input.recommendation,
          overallScore: input.overallScore,
          comments: input.comments,
          ratings: input.ratings ?? {},
          updatedAt: new Date(),
        },
      })
      .returning();

    // Mark interview as completed if overall review submitted
    await tx
      .update(schema.interviews)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(schema.interviews.id, input.interviewId));

    return { scorecard, feedback };
  });
}

export async function listOffersForOrganization(db: Database, organizationId: string, options?: { applicationId?: string }) {
  const conditions = [eq(schema.offers.organizationId, organizationId)];
  if (options?.applicationId) {
    conditions.push(eq(schema.offers.applicationId, options.applicationId));
  }

  return await db
    .select({
      offer: schema.offers,
      jobTitle: schema.jobs.title,
      candidateName: schema.profiles.displayName,
      candidateEmail: schema.users.email,
      candidateProfileId: schema.candidateProfiles.id,
    })
    .from(schema.offers)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.offers.applicationId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .innerJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(schema.offers.createdAt));
}

export async function createOffer(db: Database, input: CreateOfferInput) {
  let targetAppId = input.applicationId;
  if (!targetAppId && input.candidateProfileId) {
    const resolved = await findOrCreateApplicationForCandidate(db, {
      candidateProfileId: input.candidateProfileId,
      organizationId: input.organizationId,
      recruiterUserId: input.recruiterUserId,
      jobId: input.jobId,
    });
    targetAppId = resolved.id;
  }

  if (!targetAppId) {
    throw new Error("applicationId atau candidateProfileId wajib diberikan.");
  }

  const [appRow] = await db
    .select({
      application: schema.applications,
      jobTitle: schema.jobs.title,
      candidateUserId: schema.candidateProfiles.userId,
      candidateName: schema.profiles.displayName,
    })
    .from(schema.applications)
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(
      and(
        eq(schema.applications.id, targetAppId),
        eq(schema.jobs.organizationId, input.organizationId)
      )
    )
    .limit(1);

  if (!appRow) {
    throw new Error("Lamaran tidak ditemukan atau bukan milik organisasi Anda.");
  }

  return await db.transaction(async (tx) => {
    const status = input.status ?? "sent";
    const now = new Date();

    const [offer] = await tx
      .insert(schema.offers)
      .values({
        applicationId: targetAppId,
        organizationId: input.organizationId,
        createdBy: input.recruiterUserId,
        status,
        terms: input.terms,
        expiresAt: input.expiresAt ?? null,
        sentAt: status === "sent" ? now : null,
      })
      .returning();

    // Transition application to "offer"
    const currentStatus = appRow.application.status;
    if (status === "sent" && currentStatus !== "offer" && currentStatus !== "hired") {
      await tx
        .update(schema.applications)
        .set({ status: "offer", updatedAt: now })
        .where(eq(schema.applications.id, targetAppId));

      await tx.insert(schema.applicationStageHistory).values({
        applicationId: targetAppId,
        fromStatus: currentStatus,
        toStatus: "offer",
        changedBy: input.recruiterUserId,
        reason: `Penawaran kerja diterbitkan (${input.terms.salary}).`,
      });
    }

    // Notify candidate with deliveries (in-app & email)
    if (status === "sent") {
      await createNotificationWithDeliveries(
        tx,
        systemNotification({
          userId: appRow.candidateUserId,
          title: `Surat Penawaran Kerja: ${appRow.jobTitle}`,
          body: `Selamat! Anda menerima penawaran kerja resmi untuk posisi ${appRow.jobTitle}. Silakan tinjau dan konfirmasi penawaran ini.`,
          data: notificationData(
            `offer:${offer.id}:sent`,
            `/candidate/applications/${targetAppId}`,
            { offerId: offer.id, applicationId: targetAppId }
          ),
        })
      );

      // Send in-app chat message into /messages
      await sendSystemHiringMessage(tx, {
        organizationId: input.organizationId,
        recruiterUserId: input.recruiterUserId,
        candidateUserId: appRow.candidateUserId,
        body: `🎉 Surat Penawaran Kerja: ${appRow.jobTitle}\nKompensasi: ${input.terms.salary}\nBatas Konfirmasi: ${input.expiresAt ? input.expiresAt.toISOString().slice(0, 10) : "7 hari ke depan"}\n\nSelamat! Kami telah menerbitkan Surat Penawaran Kerja resmi untuk Anda. Silakan tinjau rincian benefit dan konfirmasi penerimaan (Accept Offer) pada aplikasi Anda.`,
      });
    }

    // Audit log
    await writeAuditLog({
      db: tx,
      actorUserId: input.recruiterUserId,
      organizationId: input.organizationId,
      action: "offer.created",
      entityType: "offer",
      entityId: offer.id,
      metadata: { applicationId: targetAppId, status },
    });

    return offer;
  });
}

export async function respondToOffer(db: Database, input: RespondToOfferInput) {
  const [offer] = await db
    .select({
      offer: schema.offers,
      application: schema.applications,
      jobTitle: schema.jobs.title,
      candidateUserId: schema.candidateProfiles.userId,
      candidateName: schema.profiles.displayName,
      organizationId: schema.offers.organizationId,
    })
    .from(schema.offers)
    .innerJoin(schema.applications, eq(schema.applications.id, schema.offers.applicationId))
    .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
    .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
    .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
    .where(eq(schema.offers.id, input.offerId))
    .limit(1);

  if (!offer) {
    throw new Error("Penawaran kerja tidak ditemukan.");
  }

  return await db.transaction(async (tx) => {
    const now = new Date();

    const [updatedOffer] = await tx
      .update(schema.offers)
      .set({
        status: input.status,
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.offers.id, input.offerId))
      .returning();

    if (input.status === "accepted") {
      // 1. Mark application as HIRED! (Dover-style)
      await tx
        .update(schema.applications)
        .set({ status: "hired", updatedAt: now })
        .where(eq(schema.applications.id, offer.offer.applicationId));

      // 2. Insert application stage history
      await tx.insert(schema.applicationStageHistory).values({
        applicationId: offer.offer.applicationId,
        fromStatus: offer.application.status,
        toStatus: "hired",
        changedBy: input.actorUserId,
        reason: input.reason || "Penawaran kerja resmi diterima oleh kandidat.",
      });

      // 3. Upsert application outcome
      await tx
        .insert(schema.applicationOutcomes)
        .values({
          applicationId: offer.offer.applicationId,
          type: "hired",
          decidedBy: offer.offer.createdBy,
          reason: input.reason || "Penawaran diterima kandidat (Hired).",
          decidedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.applicationOutcomes.applicationId,
          set: {
            type: "hired",
            decidedAt: now,
            reason: input.reason || "Penawaran diterima kandidat (Hired).",
          },
        });

      // 4. Notify recruiter(s)
      if (input.isCandidate) {
        await createNotificationWithDeliveries(
          tx,
          systemNotification({
            userId: offer.offer.createdBy,
            title: `Kandidat Menerima Penawaran! 🎉`,
            body: `${offer.candidateName ?? "Kandidat"} resmi menerima penawaran kerja untuk ${offer.jobTitle}. Status lamaran: HIRED.`,
            data: notificationData(
              `offer:${offer.offer.id}:accepted:${Date.now()}`,
              `/recruiter/applications/${offer.offer.applicationId}`,
              { offerId: offer.offer.id, applicationId: offer.offer.applicationId }
            ),
          })
        );
      }
    }

    // Audit log
    await writeAuditLog({
      db: tx,
      actorUserId: input.actorUserId,
      organizationId: offer.organizationId,
      action: `offer.${input.status}`,
      entityType: "offer",
      entityId: offer.offer.id,
      metadata: { applicationId: offer.offer.applicationId, status: input.status },
    });

    return updatedOffer;
  });
}

export async function markApplicationHired(
  db: Database,
  applicationId: string,
  recruiterUserId: string,
  organizationId: string,
  reason?: string
) {
  return await db.transaction(async (tx) => {
    const now = new Date();

    const [appRow] = await tx
      .select({
        application: schema.applications,
        jobTitle: schema.jobs.title,
        candidateUserId: schema.candidateProfiles.userId,
      })
      .from(schema.applications)
      .innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId))
      .innerJoin(schema.candidateProfiles, eq(schema.candidateProfiles.id, schema.applications.candidateProfileId))
      .where(
        and(
          eq(schema.applications.id, applicationId),
          eq(schema.jobs.organizationId, organizationId)
        )
      )
      .limit(1);

    if (!appRow) {
      throw new Error("Lamaran tidak ditemukan atau bukan milik organisasi Anda.");
    }

    const previousStatus = appRow.application.status;

    // 1. Update application to hired
    const [updated] = await tx
      .update(schema.applications)
      .set({ status: "hired", updatedAt: now })
      .where(eq(schema.applications.id, applicationId))
      .returning();

    // 2. Stage history
    await tx.insert(schema.applicationStageHistory).values({
      applicationId,
      fromStatus: previousStatus,
      toStatus: "hired",
      changedBy: recruiterUserId,
      reason: reason || "Ditandai sebagai diterima bekerja (Hired).",
    });

    // 3. Application outcome
    await tx
      .insert(schema.applicationOutcomes)
      .values({
        applicationId,
        type: "hired",
        decidedBy: recruiterUserId,
        reason: reason || "Kandidat diterima bekerja oleh rekruter.",
        decidedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.applicationOutcomes.applicationId,
        set: {
          type: "hired",
          decidedAt: now,
          reason: reason || "Kandidat diterima bekerja oleh rekruter.",
        },
      });

    // 4. Notify candidate
    await createNotificationWithDeliveries(
      tx,
      systemNotification({
        userId: appRow.candidateUserId,
        title: `Selamat! Anda Diterima Bekerja 🎉`,
        body: `Lamaran Anda untuk posisi ${appRow.jobTitle} telah resmi diterima (Hired). Selamat bergabung!`,
        data: notificationData(
          `application:${applicationId}:hired`,
          `/candidate/applications/${applicationId}`,
          { applicationId, status: "hired" }
        ),
      })
    );

    // 5. Audit log
    await writeAuditLog({
      db: tx,
      actorUserId: recruiterUserId,
      organizationId,
      action: "application.hired",
      entityType: "application",
      entityId: applicationId,
      metadata: { reason },
    });

    return updated;
  });
}
