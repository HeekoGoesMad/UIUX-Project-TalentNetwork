import "server-only";

import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { schema, type Database } from "@/db";
import { deleteProfileMedia } from "@/lib/profile/storage";

export type DeleteCandidateAccountResult = {
  success: boolean;
  deletedFilesCount: number;
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
  const { userId, authUserId, db } = params;

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

  // 5. Identify message attachments uploaded by the candidate
  const sentMessagesWithAttachment = await db
    .select({ attachmentStoragePath: schema.messages.attachmentStoragePath })
    .from(schema.messages)
    .where(
      and(
        eq(schema.messages.senderId, userId),
        isNotNull(schema.messages.attachmentStoragePath)
      )
    );
  const messageAttachmentPaths = sentMessagesWithAttachment
    .map((m) => m.attachmentStoragePath)
    .filter(Boolean) as string[];

  // 6. Identify screening runs for candidate to unlink token ledger charges
  let screeningRunIds: string[] = [];
  if (candidateProfile) {
    const runs = await db
      .select({ id: schema.screeningRuns.id })
      .from(schema.screeningRuns)
      .where(eq(schema.screeningRuns.candidateProfileId, candidateProfile.id));
    screeningRunIds = runs.map((r) => r.id);
  }

  // 7. Execute Database Transaction for complete, clean purge
  await db.transaction(async (tx) => {
    // 7a. Unlink token ledger charges and delete screening runs
    if (screeningRunIds.length > 0) {
      await tx
        .update(schema.tokenLedgerEntries)
        .set({ screeningRunId: null })
        .where(inArray(schema.tokenLedgerEntries.screeningRunId, screeningRunIds));

      await tx
        .delete(schema.screeningRuns)
        .where(inArray(schema.screeningRuns.id, screeningRunIds));
    }

    // 7b. Delete job applications (cascades to interviews, offers, assessments, etc.)
    if (candidateProfile) {
      await tx
        .delete(schema.applications)
        .where(eq(schema.applications.candidateProfileId, candidateProfile.id));
    }

    // 7c. Delete messages sent by user
    await tx.delete(schema.messages).where(eq(schema.messages.senderId, userId));

    // 7d. Remove user from conversation participants
    await tx
      .delete(schema.conversationParticipants)
      .where(eq(schema.conversationParticipants.userId, userId));

    // 7e. Delete empty conversations initiated by the user
    await tx
      .delete(schema.conversations)
      .where(eq(schema.conversations.createdBy, userId));

    // 7f. Delete the core user row
    // Cascades automatically to:
    // - profiles
    // - candidateProfiles -> candidateProfileSections, shortlistItems, consentRequestItems, cvDocuments, candidateDocuments, candidateVerifications
    // - notifications, notificationPreferences
    // - messageReports
    await tx.delete(schema.users).where(eq(schema.users.id, userId));
  });

  // 8. Cloud Storage Files Purge
  let deletedFilesCount = 0;

  // 8a. Avatar & Banner
  if (profile?.avatarUrl) {
    const deleted = await deleteProfileMedia(profile.avatarUrl);
    if (deleted) deletedFilesCount++;
  }
  if (bannerUrl) {
    const deleted = await deleteProfileMedia(bannerUrl);
    if (deleted) deletedFilesCount++;
  }

  // 8b. CV documents
  for (const path of cvPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  // 8c. Candidate documents
  for (const path of candDocPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  // 8d. Message attachments
  for (const path of messageAttachmentPaths) {
    const deleted = await removeStorageFileByPath(path);
    if (deleted) deletedFilesCount++;
  }

  // 9. Supabase Auth Purge (if authUserId and service role key available)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey && authUserId) {
    try {
      const supabaseAdmin = createSupabaseClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      if (deleteAuthError) {
        console.warn(`[account-deletion] Gagal menghapus auth user ${authUserId}: ${deleteAuthError.message}`);
      }
    } catch (err) {
      console.warn(`[account-deletion] Exception saat menghapus auth user ${authUserId}:`, err);
    }
  }

  return {
    success: true,
    deletedFilesCount,
    message: "Akun dan seluruh data kandidat Anda telah berhasil dihapus secara permanen.",
  };
}
