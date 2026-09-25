import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const checkPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = checkPasswordSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Permintaan tidak valid." },
        { status: 400 }
      );
    }

    const { email, newPassword } = parsed.data;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // In demo or non-supabase environments
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ isSame: false });
    }

    // Create an isolated auth client without persisting session cookies
    const testClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await testClient.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (data?.user && !error) {
      // The credentials match the current active password!
      return NextResponse.json({
        isSame: true,
        message: "Kata sandi baru tidak boleh sama dengan kata sandi lama. Silakan buat kata sandi yang berbeda.",
      });
    }

    return NextResponse.json({ isSame: false });
  } catch (error) {
    console.error("[check-old-password] Error validating password:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi kata sandi saat ini." },
      { status: 500 }
    );
  }
}
