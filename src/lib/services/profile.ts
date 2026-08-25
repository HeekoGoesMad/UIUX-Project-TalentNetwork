import "server-only";

import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { schema, type Database } from "@/db";
import type { CandidateProfileSync } from "@/lib/profile/schema";

export class ProfileService {
  /**
   * Sync candidate profile, user record, base profile, and dynamic sections.
   */
  static async syncCandidateProfile(
    db: Database,
    authUser: User,
    payload: CandidateProfileSync
  ) {
    const email = authUser.email;
    if (!email) {
      return { error: "Akun kandidat tidak memiliki email yang valid.", status: 400 as const };
    }

    return db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select({ id: schema.users.id, role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.authUserId, authUser.id))
        .limit(1);

      if (existingUser && existingUser.role !== "candidate") {
        return { error: "Hanya akun kandidat yang dapat menyinkronkan profil.", status: 403 as const };
      }

      const [user] = await tx
        .insert(schema.users)
        .values({
          authUserId: authUser.id,
          email,
          role: "candidate",
        })
        .onConflictDoUpdate({
          target: schema.users.authUserId,
          set: { email, updatedAt: new Date() },
        })
        .returning({ id: schema.users.id });

      const now = new Date();
      const [profile] = await tx
        .insert(schema.profiles)
        .values({
          userId: user.id,
          displayName: payload.displayName ?? null,
          avatarUrl: payload.avatarUrl ?? null,
          phone: payload.phone ?? null,
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            displayName: payload.displayName ?? null,
            avatarUrl: payload.avatarUrl ?? null,
            phone: payload.phone ?? null,
            updatedAt: now,
          },
        })
        .returning({ id: schema.profiles.id });

      const [candidateProfile] = await tx
        .insert(schema.candidateProfiles)
        .values({
          userId: user.id,
          headline: payload.headline ?? null,
          targetRole: payload.targetRole ?? null,
          location: payload.location ?? null,
          summary: payload.summary ?? null,
          isPublished: payload.isPublished ?? false,
          completeness: payload.completeness ?? 0,
        })
        .onConflictDoUpdate({
          target: schema.candidateProfiles.userId,
          set: {
            headline: payload.headline ?? null,
            targetRole: payload.targetRole ?? null,
            location: payload.location ?? null,
            summary: payload.summary ?? null,
            isPublished: payload.isPublished ?? false,
            completeness: payload.completeness ?? 0,
            updatedAt: now,
          },
        })
        .returning({ id: schema.candidateProfiles.id });

      for (const section of payload.sections ?? []) {
        await tx
          .insert(schema.candidateProfileSections)
          .values({
            candidateProfileId: candidateProfile.id,
            type: section.type,
            content: section.content,
            sortOrder: section.sortOrder ?? 0,
          })
          .onConflictDoUpdate({
            target: [
              schema.candidateProfileSections.candidateProfileId,
              schema.candidateProfileSections.type,
            ],
            set: { content: section.content, sortOrder: section.sortOrder ?? 0, updatedAt: now },
          });
      }

      return {
        userId: user.id,
        profileId: profile.id,
        candidateProfileId: candidateProfile.id,
      };
    });
  }
}
