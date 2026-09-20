import "server-only";

import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { schema, type Database } from "@/db";
import { cleanUserStorageMedia, deleteProfileMedia } from "@/lib/profile/storage";

export type DeleteCandidateAccountResult = {
  success: boolean;
  deletedFilesCount: number;
  deletedConversationsCount: number;
  message: string;
};

async function getAdminStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || (!serviceKey && !anonKey)) {
    return null;
  }

  const key = serviceKey || anonKey!;
  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function removeStorageFileByPath(storagePath: string): Promise<boolean> {
  if (!storagePath || storagePath.startsWith("development-mock/")) {
    return true;
  }

  const slashIndex = storagePath.indexOf("/");
  if (slashIndex <= 0) return false;

  const bucket = storagePath.substring(0, slashIndex);
  const key = storagePath.substring(slashIndex + 1);

  if (!bucket || !key) return false;

  const client = await getAdminStorageClient();
  if (!client) return true;

  try {
    const { error } = await client.storage.from(bucket).remove([key]);
    if (error) {
      console.warn(`[account-deletion] Gagal menghapus file ${storagePath}: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[account-deletion] Exception saat menghapus file ${storagePath}:`, err);
    return false;
  }
}

async function removeStorageFolder(bucket: string, folder: string): Promise<number> {
  if (!bucket || !folder) return 0;
  const client = await getAdminStorageClient();
  if (!client) return 0;

  try {
    const { data: files, error } = await client.storage.from(bucket).list(folder, { limit: 1000 });
    if (error || !files || files.length === 0) return 0;

    const pathsToDelete = files
      .filter((f) => f.name && !f.name.startsWith("."))
      .map((f) => `${folder}/${f.name}`);

    if (pathsToDelete.length > 0) {
      const { error: removeError } = await client.storage.from(bucket).remove(pathsToDelete);
      if (removeError) {
        console.warn(`[account-deletion] Gagal membersihkan folder ${bucket}/${folder}:`, removeError);
        return 0;
      }
      return pathsToDelete.length;
    }
    return 0;
  } catch (err) {
    console.warn(`[account-deletion] Exception saat membersihkan folder ${bucket}/${folder}:`, err);
    return 0;
  }
}

/**
 * Permanently deletes all data associated with a candidate account.
 * Ensures zero-orphan data by resolving database relations in sequence,
 * purging cloud storage files, and deleting the Supabase Auth user record.
 */
export async function deleteCandidateAccount(params: {
  userId: string;
  authUserId?: string | null;
  email?: string | null;
  db: Database;
}): Promise<DeleteCandidateAccountResult> {
  const { userId, authUserId, email, db } = params;

  // 1. Identify candidate profile and profile media records
  const [candidateProfile] = await db
    .select({ id: schema.candidateProfiles.id })
    .from(schema.candidateProfiles)
    .where(eq(schema.candidateProfiles.userId, userId))
    .limit(1);

  const [profile] = await db
    .select({ avatarUrl: schema.profiles.avatarUrl })
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  // 2. Identify banner URL in preferences section
  let bannerUrl: string | null = null;
  if (candidateProfile) {
    const [prefSection] = await db
      .select({ content: schema.candidateProfileSections.content })
      .from(schema.candidateProfileSections)
      .where(
        and(
          eq(schema.candidateProfileSections.candidateProfileId, candidateProfile.id),
          eq(schema.candidateProfileSections.type, "preferences")
        )
      )
      .limit(1);

    const content = prefSection?.content as Record<string, unknown> | null;
    if (typeof content?.bannerUrl === "string") {
      bannerUrl = content.bannerUrl;
    }
  }

  // 3. Identify all stored CV documents
  const cvPaths: string[] = [];
  if (candidateProfile) {
    const cvDocs = await db
      .select({ storagePath: schema.cvDocuments.storagePath })
      .from(schema.cvDocuments)
      .where(eq(schema.cvDocuments.candidateProfileId, candidateProfile.id));

    for (const doc of cvDocs) {
      if (doc.storagePath) cvPaths.push(doc.storagePath);
    }
  }

  // 4. Identify candidate documents (general documents / portfolio attachments)
  const candDocConditions = [eq(schema.candidateDocuments.ownerUserId, userId)];
  if (candidateProfile) {
    candDocConditions.push(eq(schema.candidateDocuments.candidateProfileId, candidateProfile.id));
  }
  const candDocs = await db
    .select({ storagePath: schema.candidateDocuments.storagePath })
    .from(schema.candidateDocuments)
    .where(or(...candDocConditions));
  const candDocPaths = candDocs.map((d) => d.storagePath).filter(Boolean);

  // 5. Identify all conversations involving the candidate (as creator OR participant)
  const candidateConversationRows = await db
    .select({ conversationId: schema.conversations.id })
    .from(schema.conversations)
    .leftJoin(
      schema.conversationParticipants,
      eq(schema.conversationParticipants.conversationId, schema.conversations.id)
    )
    .where(
      or(
        eq(schema.conversations.createdBy, userId),
        eq(schema.conversationParticipants.userId, userId)
      )
    );

  const candidateConversationIds = Array.from(
    new Set(candidateConversationRows.map((r) => r.conversationId).filter(Boolean))
  );

  // 6. Identify all message attachments in those conversations AND sent by user
  const messageAttachmentPaths: string[] = [];
  if (candidateConversationIds.length > 0) {
    const convMessagesWithAttachment = await db
      .select({ attachmentStoragePath: schema.messages.attachmentStoragePath })
      .from(schema.messages)
      .where(
        and(
          inArray(schema.messages.conversationId, candidateConversationIds),
          isNotNull(schema.messages.attachmentStoragePath)
        )
      );
    for (const m of convMessagesWithAttachment) {
      if (m.attachmentStoragePath) messageAttachmentPaths.push(m.attachmentStoragePath);
    }
  }

  const sentMessagesWithAttachment = await db
    .select({ attachmentStoragePath: schema.messages.attachmentStoragePath })
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.senderId, userId),
        isNotNull(schema.messages.attachmentStoragePath)
      )
    );
  for (const m of sentMessagesWithAttachment) {
    if (m.attachmentStoragePath && !messageAttachmentPaths.includes(m.attachmentStoragePath)) {
      messageAttachmentPaths.push(m.attachmentStoragePath);
    }
  }

  // 7. Identify screening runs for candidate to unlink token ledger charges
  let screeningRunIds: string[] = [];
  if (candidateProfile) {
    const runs = await db
      .select({ id: schema.screeningRuns.id })
      .from(schema.screeningRuns)
      .where(eq(schema.screeningRuns.candidateProfileId, candidateProfile.id));
    screeningRunIds = runs.map((r) => r.id);
  }

  // 8. Execute Database Transaction for complete, clean purge
  await db.transaction(async (tx) => {
    // 8a. Unlink token ledger charges and delete screening runs
    if (screeningRunIds.length > 0) {
      await tx
        .update(schema.tokenLedgerEntries)
        .set({
          screeningRunId: null,
          metadata: {
            sanitized: true,
            candidateProfileId: null,
            purgedAt: new Date().toISOString(),
          },
        })
        .where(inArray(schema.tokenLedgerEntries.screeningRunId, screeningRunIds));

      await tx
        .delete(schema.screeningRuns)
        .where(inArray(schema.screeningRuns.id, screeningRunIds));
    }

    // 8b. Explicitly delete assessment invitations (breaks restrictive FK)
    if (candidateProfile) {
      await tx
        .delete(schema.assessmentInvitations)
        .where(eq(schema.assessmentInvitations.candidateProfileId, candidateProfile.id));
    }

    // 8c. Delete job applications & candidate stage history
    if (candidateProfile) {
      await tx
        .delete(schema.applications)
        .where(eq(schema.applications.candidateProfileId, candidateProfile.id));
    }

    await tx
      .delete(schema.applicationStageHistory)
      .where(eq(schema.applicationStageHistory.changedBy, userId));

    // 8d. Delete consent events created by the candidate
    await tx
      .delete(schema.consentEvents)
      .where(eq(schema.consentEvents.actorUserId, userId));

    // 8e. Delete all conversations involving the candidate
    // Cascades automatically to messages, conversationParticipants, and messageReports
    if (candidateConversationIds.length > 0) {
      await tx
        .delete(schema.conversations)
        .where(inArray(schema.conversations.id, candidateConversationIds));
    }

    // Stray messages sent by user (if any exist outside deleted conversations)
    await tx.delete(schema.messages).where(eq(schema.messages.senderId, userId));

    // Stray conversation participant entries
    await tx
      .delete(schema.conversationParticipants)
      .where(eq(schema.conversationParticipants.userId, userId));

    // 8f. Delete search alerts and search analytics for the user
    await tx
      .delete(schema.searchAlerts)
      .where(eq(schema.searchAlerts.userId, userId));

    await tx
      .delete(schema.searchAnalytics)
      .where(eq(schema.searchAnalytics.userId, userId));

    // 8g. Purge candidate audit logs (leaves zero personal data / PII)
    await tx
      .delete(schema.auditLogs)
      .where(
        or(
          eq(schema.auditLogs.actorUserId, userId),
          and(
            eq(schema.auditLogs.entityType, "user"),
            eq(schema.auditLogs.entityId, userId)
          )
        )
      );

    // 8h. Delete the core user row
    // Cascades automatically to:
    // - profiles
    // - candidateProfiles -> candidateProfileSections, shortlistItems, consentRequestItems, cvDocuments, candidateDocuments, candidateVerifications
    // - notifications, notificationPreferences
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });

  // 9. Cloud Storage Files Purge
  let deletedFilesCount = 0;

  // 9a. Avatar & Banner
  if (profile?.avatarUrl) {
    const deleted = await deleteProfileMedia(profile.avatarUrl);
    if (deleted) deletedFilesCount++;
  }
  if (bannerUrl) {
    const deleted = await deleteProfileMedia(bannerUrl);
    if (deleted) deletedFilesCount++;
  }
  await cleanUserStorageMedia(userId, "avatar");
  await cleanUserStorageMedia(userId, "banner");

  // 9b. CV documents
  for (const path of cvPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  // 9c. Candidate documents
  for (const path of candDocPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  // 9d. Clean CV folder in bucket
  const cvBucket = process.env.SUPABASE_CV_BUCKET?.trim() || "cv-documents";
  if (candidateProfile) {
    const folderPurged = await removeStorageFolder(cvBucket, candidateProfile.id);
    deletedFilesCount += folderPurged;
  }

  // 9e. Message attachments
  for (const path of messageAttachmentPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  const messageBucket = process.env.SUPABASE_MESSAGE_BUCKET?.trim() || "message-attachments";
  for (const convId of candidateConversationIds) {
    const convPurged = await removeStorageFolder(messageBucket, `conversations/${convId}`);
    deletedFilesCount += convPurged;
  }

  // 10. Supabase Auth Purge (if authUserId/email and service role key available)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) {
    try {
      const supabaseAdmin = createSupabaseClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      let targetAuthId = authUserId;
      if (!targetAuthId && email) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const matched = listData?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
        if (matched) {
          targetAuthId = matched.id;
        }
      }

      if (targetAuthId) {
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(targetAuthId);
        if (deleteAuthError) {
          console.warn(`[account-deletion] Gagal menghapus auth user ${targetAuthId}: ${deleteAuthError.message}`);
        }
      }
    } catch (err) {
      console.warn(`[account-deletion] Exception saat menghapus auth user:`, err);
    }
  }

  return {
    success: true,
    deletedFilesCount,
    deletedConversationsCount: candidateConversationIds.length,
    message: "Akun dan seluruh data kandidat Anda telah berhasil dihapus secara permanen.",
  };
}
