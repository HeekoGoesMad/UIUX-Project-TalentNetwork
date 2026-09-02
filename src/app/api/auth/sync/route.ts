import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { syncAuthenticatedUser } from "@/lib/api/sync-user";

const syncSchema = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(160).optional(),
  role: z.enum(["candidate", "recruiter", "partner"]).optional(),
});

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Database belum dikonfigurasi." }, { status: 503 });

  const payload = syncSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) return NextResponse.json({ error: "Data akun tidak valid." }, { status: 400 });

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });

    const result = await syncAuthenticatedUser(data.user, payload.data);
    // Self-heal stale signup metadata so the client never disagrees with the DB role.
    if (data.user.user_metadata?.role !== result.role) {
      const { error: metadataError } = await supabase.auth.updateUser({ data: { role: result.role, provisioningStatus: result.provisioningStatus } });
      if (metadataError) console.error("Gagal memperbarui metadata peran:", metadataError);
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("ROLE_MISMATCH:")) {
      const [, actualRole] = error.message.split(":");
      const actualRoleLabel = actualRole === "candidate" ? "Talent / Candidate" : actualRole === "recruiter" ? "Recruiter / Hiring" : "Partner";
      return NextResponse.json({
        code: "ROLE_MISMATCH",
        actualRole,
        error: `Akun ini terdaftar sebagai ${actualRoleLabel}. Silakan pilih peran ${actualRoleLabel} untuk masuk.`,
      }, { status: 403 });
    }

    console.error("Gagal menyinkronkan akun", error);
    return NextResponse.json({
      error: "Akun belum dapat disinkronkan ke database.",
      details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined,
      cause: process.env.NODE_ENV === "development" && error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
    }, { status: 503 });
  }
}
