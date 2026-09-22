import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { ProfileService } from "@/lib/services/profile";
import { writeAuditLog } from "@/lib/audit";

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Nama tidak boleh kosong").max(100, "Nama maksimal 100 karakter").optional(),
  phone: z.string().trim().max(30, "Nomor telepon maksimal 30 karakter").optional().nullable(),
}).strict();

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [profile] = await current.db.select({
      id: schema.profiles.id,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      phone: schema.profiles.phone,
      createdAt: schema.profiles.createdAt,
      updatedAt: schema.profiles.updatedAt,
    }).from(schema.profiles).where(eq(schema.profiles.userId, current.user.id)).limit(1);

    if (profile && !profile.avatarUrl) {
      profile.avatarUrl = await ProfileService.resolveAndRecoverAvatar(
        current.db,
        current.user.id,
        profile.avatarUrl
      );
    }

    let candidateProfile;
    let sections: unknown[] = [];
    if (current.user.role === "candidate") {
      [candidateProfile] = await current.db.select().from(schema.candidateProfiles)
        .where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
      if (candidateProfile) {
        sections = await current.db.select().from(schema.candidateProfileSections)
          .where(eq(schema.candidateProfileSections.candidateProfileId, candidateProfile.id));
      }
    }

    return NextResponse.json({
      user: { id: current.user.id, email: current.user.email, role: current.user.role },
      profile: profile ?? null,
      candidateProfile: candidateProfile ?? null,
      sections,
    });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const body = await request.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data profil tidak valid.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { displayName, phone } = parsed.data;
    if (displayName === undefined && phone === undefined) {
      return NextResponse.json({ error: "Tidak ada bidang profil yang diperbarui." }, { status: 400 });
    }

    const saved = await current.db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(schema.profiles)
        .where(eq(schema.profiles.userId, current.user.id))
        .limit(1);

      const newValues: { displayName?: string; phone?: string | null; updatedAt: Date } = {
        updatedAt: new Date(),
      };
      if (displayName !== undefined) newValues.displayName = displayName;
      if (phone !== undefined) newValues.phone = phone;

      let result;
      if (existing) {
        const [updated] = await tx
          .update(schema.profiles)
          .set(newValues)
          .where(eq(schema.profiles.userId, current.user.id))
          .returning();
        result = updated;
      } else {
        const [inserted] = await tx
          .insert(schema.profiles)
          .values({
            userId: current.user.id,
            displayName:
              displayName ??
              (typeof current.authUser?.user_metadata?.name === "string"
                ? current.authUser.user_metadata.name
                : current.user.email.split("@")[0]),
            phone: phone ?? null,
            updatedAt: new Date(),
          })
          .returning();
        result = inserted;
      }

      await writeAuditLog({
        db: tx,
        actorUserId: current.user.id,
        action: "profile.updated",
        entityType: "profile",
        entityId: result.id,
        metadata: { displayName: result.displayName, phone: result.phone },
      });

      return result;
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: saved.id,
        displayName: saved.displayName,
        avatarUrl: saved.avatarUrl,
        phone: saved.phone,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err) {
    console.error("Gagal memperbarui profil:", err);
    return NextResponse.json({ error: "Profil tidak dapat disimpan saat ini." }, { status: 500 });
  }
}
