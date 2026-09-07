import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import {
  ProfileMediaConfigurationError,
  storeProfileMedia,
  validateProfileImage,
} from "@/lib/profile/storage";

export async function POST(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) {
      return NextResponse.json({ error: current.error }, { status: current.status });
    }

    const rate = enforceRateLimit(`profile-media:${current.user.id}`, 15, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak unggahan. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Request harus berupa multipart/form-data." },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Gagal memproses file yang diunggah." },
        { status: 400 }
      );
    }

    const rawFile = formData.get("file");
    const rawType = formData.get("type");
    const mediaType = rawType === "banner" ? "banner" : "avatar";

    if (!(rawFile instanceof File) || rawFile.size === 0) {
      return NextResponse.json(
        { error: "File gambar wajib diunggah." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await rawFile.arrayBuffer());
    const validation = validateProfileImage({ bytes, type: mediaType });
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const storageResult = await storeProfileMedia({
      userId: current.user.id,
      fileName: rawFile.name,
      bytes,
      type: mediaType,
      contentType: validation.mime,
    });

    const now = new Date();

    if (mediaType === "avatar") {
      await current.db
        .insert(schema.profiles)
        .values({
          userId: current.user.id,
          avatarUrl: storageResult.publicUrl,
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            avatarUrl: storageResult.publicUrl,
            updatedAt: now,
          },
        });

      await writeAuditLog({
        db: current.db,
        actorUserId: current.user.id,
        action: "profile.avatar.updated",
        entityType: "profile",
        entityId: current.user.id,
        metadata: { url: storageResult.publicUrl },
      });
    } else {
      // mediaType === "banner"
      const [candidateProfile] = await current.db
        .select({ id: schema.candidateProfiles.id })
        .from(schema.candidateProfiles)
        .where(eq(schema.candidateProfiles.userId, current.user.id))
        .limit(1);

      if (candidateProfile) {
        const [existingSection] = await current.db
          .select({ content: schema.candidateProfileSections.content })
          .from(schema.candidateProfileSections)
          .where(
            and(
              eq(
                schema.candidateProfileSections.candidateProfileId,
                candidateProfile.id
              ),
              eq(schema.candidateProfileSections.type, "preferences")
            )
          )
          .limit(1);

        const mergedContent = {
          ...(existingSection?.content ?? {}),
          bannerUrl: storageResult.publicUrl,
        };

        await current.db
          .insert(schema.candidateProfileSections)
          .values({
            candidateProfileId: candidateProfile.id,
            type: "preferences",
            content: mergedContent,
            sortOrder: 0,
          })
          .onConflictDoUpdate({
            target: [
              schema.candidateProfileSections.candidateProfileId,
              schema.candidateProfileSections.type,
            ],
            set: { content: mergedContent, updatedAt: now },
          });

        await writeAuditLog({
          db: current.db,
          actorUserId: current.user.id,
          action: "profile.banner.updated",
          entityType: "candidate_profile",
          entityId: candidateProfile.id,
          metadata: { url: storageResult.publicUrl },
        });
      }
    }

    return NextResponse.json({
      url: storageResult.publicUrl,
      type: mediaType,
      status: storageResult.status,
    });
  } catch (error) {
    if (error instanceof ProfileMediaConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    console.error("Gagal mengunggah media profil:", error);
    return NextResponse.json(
      { error: "Media profil belum dapat disimpan saat ini." },
      { status: 500 }
    );
  }
}
