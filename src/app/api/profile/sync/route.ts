import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";

import { getDb, schema } from "@/db";
import { candidateProfileSyncSchema } from "@/lib/profile/schema";
import { createClient } from "@/lib/supabase/server";

function validationResponse(error: ZodError) {
  return NextResponse.json({
    error: "Data profil tidak valid.",
    details: error.issues.map((issue) => ({
      field: issue.path.join(".") || "payload",
      message: issue.message,
    })),
  }, { status: 400 });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body request harus berupa JSON yang valid." }, { status: 400 });
  }

  const parsed = candidateProfileSyncSchema.safeParse(payload);
  if (!parsed.success) return validationResponse(parsed.error);

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ error: "Konfigurasi autentikasi server belum lengkap." }, { status: 503 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sesi login tidak valid atau sudah berakhir." }, { status: 401 });
  }

  const email = authData.user.email;
  if (!email) {
    return NextResponse.json({ error: "Akun kandidat tidak memiliki email yang valid." }, { status: 400 });
  }

  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      const existingUser = await tx.query.users.findFirst({
        where: eq(schema.users.authUserId, authData.user.id),
      });

      if (existingUser && existingUser.role !== "candidate") {
        throw new Error("ROLE_NOT_CANDIDATE");
      }

      const [user] = await tx.insert(schema.users).values({
        authUserId: authData.user.id,
        email,
        role: "candidate",
      }).onConflictDoUpdate({
        target: schema.users.authUserId,
        set: { email, updatedAt: new Date() },
      }).returning({ id: schema.users.id });

      const now = new Date();
      const [profile] = await tx.insert(schema.profiles).values({
        userId: user.id,
        displayName: parsed.data.displayName ?? null,
        avatarUrl: parsed.data.avatarUrl ?? null,
        phone: parsed.data.phone ?? null,
      }).onConflictDoUpdate({
        target: schema.profiles.userId,
        set: {
          displayName: parsed.data.displayName ?? null,
          avatarUrl: parsed.data.avatarUrl ?? null,
          phone: parsed.data.phone ?? null,
          updatedAt: now,
        },
      }).returning({ id: schema.profiles.id });

      const [candidateProfile] = await tx.insert(schema.candidateProfiles).values({
        userId: user.id,
        headline: parsed.data.headline ?? null,
        targetRole: parsed.data.targetRole ?? null,
        location: parsed.data.location ?? null,
        summary: parsed.data.summary ?? null,
        isPublished: parsed.data.isPublished ?? false,
        completeness: parsed.data.completeness ?? 0,
      }).onConflictDoUpdate({
        target: schema.candidateProfiles.userId,
        set: {
          headline: parsed.data.headline ?? null,
          targetRole: parsed.data.targetRole ?? null,
          location: parsed.data.location ?? null,
          summary: parsed.data.summary ?? null,
          isPublished: parsed.data.isPublished ?? false,
          completeness: parsed.data.completeness ?? 0,
          updatedAt: now,
        },
      }).returning({ id: schema.candidateProfiles.id });

      for (const section of parsed.data.sections ?? []) {
        await tx.insert(schema.candidateProfileSections).values({
          candidateProfileId: candidateProfile.id,
          type: section.type,
          content: section.content,
          sortOrder: section.sortOrder ?? 0,
        }).onConflictDoUpdate({
          target: [schema.candidateProfileSections.candidateProfileId, schema.candidateProfileSections.type],
          set: { content: section.content, sortOrder: section.sortOrder ?? 0, updatedAt: now },
        });
      }

      return { userId: user.id, profileId: profile.id, candidateProfileId: candidateProfile.id };
    });

    return NextResponse.json({ message: "Profil kandidat berhasil disinkronkan.", ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "ROLE_NOT_CANDIDATE") {
      return NextResponse.json({ error: "Hanya akun kandidat yang dapat menyinkronkan profil." }, { status: 403 });
    }

    console.error("Gagal menyinkronkan profil kandidat", error);
    return NextResponse.json({ error: "Profil tidak dapat disimpan saat ini." }, { status: 500 });
  }
}
