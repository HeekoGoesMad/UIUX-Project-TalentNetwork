import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const setupPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Kata sandi minimal harus 8 karakter.")
    .regex(/[A-Z]/, "Kata sandi harus memuat huruf besar (A-Z).")
    .regex(/[a-z]/, "Kata sandi harus memuat huruf kecil (a-z).")
    .regex(/[0-9]/, "Kata sandi harus memuat angka (0-9)."),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Sesi login tidak valid atau telah berakhir." }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = setupPasswordSchema.safeParse(json);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues[0]?.message || "Kata sandi tidak memenuhi kriteria.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { password } = parsed.data;

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        hasPassword: true,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Update hasPassword in Postgres Database
    if (process.env.DATABASE_URL) {
      try {
        const db = getDb();
        await db
          .update(schema.users)
          .set({
            hasPassword: true,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.authUserId, authData.user.id));
      } catch (dbErr) {
        console.error("Gagal memperbarui hasPassword di database:", dbErr);
      }
    }

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diatur." });
  } catch (error) {
    console.error("Error setting up password:", error);
    return NextResponse.json(
      { error: "Gagal mengatur kata sandi. Silakan coba kembali." },
      { status: 500 }
    );
  }
}
