import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getDb } from "@/db";
import { candidateProfileSyncSchema } from "@/lib/profile/schema";
import { createClient } from "@/lib/supabase/server";
import { ProfileService } from "@/lib/services/profile";

function validationResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: "Data profil tidak valid.",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "payload",
        message: issue.message,
      })),
    },
    { status: 400 }
  );
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

  try {
    const db = getDb();
    const result = await ProfileService.syncCandidateProfile(db, authData.user, parsed.data);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ message: "Profil kandidat berhasil disinkronkan.", ...result });
  } catch (error) {
    console.error("Gagal menyinkronkan profil kandidat", error);
    return NextResponse.json({ error: "Profil tidak dapat disimpan saat ini." }, { status: 500 });
  }
}
