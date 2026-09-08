import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { withAuth, type AuthContext } from "@/lib/api/auth";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { deleteCandidateAccount } from "@/lib/services/candidate-account-deletion";

const deleteAccountSchema = z.object({
  confirmationPhrase: z.string().min(1, "Frasa konfirmasi wajib diisi."),
  password: z.string().optional(),
  acknowledged: z.literal(true, {
    error: "Konfirmasi pemahaman penghapusan wajib disetujui.",
  }),
});

export const DELETE = withAuth(
  async (auth: AuthContext, req: NextRequest) => {
    try {
      const { user, db, authUser } = auth;

      // Rate limit: max 5 deletion attempts per hour per user
      const rate = enforceRateLimit(`account-delete:${user.id}`, 5, 3600_000);
      if (!rate.allowed) {
        return NextResponse.json(
          { error: "Terlalu banyak percobaan penghapusan akun. Silakan coba lagi nanti." },
          { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
        );
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Format request tidak valid." },
          { status: 400 }
        );
      }

      const parsed = deleteAccountSchema.safeParse(body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return NextResponse.json(
          { error: firstIssue?.message || "Data konfirmasi tidak valid." },
          { status: 400 }
        );
      }

      const { confirmationPhrase, password } = parsed.data;

      // Check confirmation phrase (case-insensitive for safety, matching either phrase or email)
      const expectedPhrase = "HAPUS AKUN SAYA";
      const matchesPhrase = confirmationPhrase.trim().toUpperCase() === expectedPhrase;
      const matchesEmail = confirmationPhrase.trim().toLowerCase() === user.email.toLowerCase();

      if (!matchesPhrase && !matchesEmail) {
        return NextResponse.json(
          { error: `Frasa konfirmasi tidak cocok. Ketik "${expectedPhrase}" atau alamat email Anda.` },
          { status: 400 }
        );
      }

      // If user has Supabase credentials and provided a password, verify it
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
      const isRealSupabase = Boolean(supabaseUrl && supabaseAnonKey);

      if (isRealSupabase && password && user.email) {
        try {
          const supabase = await createClient();
          const { error: verifyAuthError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
          });

          if (verifyAuthError) {
            return NextResponse.json(
              { error: "Kata sandi yang Anda masukkan salah. Verifikasi identitas gagal." },
              { status: 400 }
            );
          }
        } catch {
          // If signIn fails unexpectedly
          return NextResponse.json(
            { error: "Verifikasi kata sandi gagal. Silakan coba beberapa saat lagi." },
            { status: 400 }
          );
        }
      }

      // Write audit log before record deletion
      await writeAuditLog({
        db,
        actorUserId: user.id,
        action: "candidate.account.deleted",
        entityType: "user",
        entityId: user.id,
        metadata: {
          email: user.email,
          authUserId: user.authUserId,
          role: user.role,
        },
      });

      // Execute complete data deletion
      const result = await deleteCandidateAccount({
        userId: user.id,
        authUserId: user.authUserId || authUser?.id || null,
        email: user.email,
        db,
      });

      return NextResponse.json({
        ok: true,
        message: result.message,
        deletedFilesCount: result.deletedFilesCount,
      });
    } catch (error) {
      console.error("[api/candidate/account] Gagal menghapus akun kandidat:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan saat memproses penghapusan akun. Silakan hubungi dukungan teknis." },
        { status: 500 }
      );
    }
  },
  { roles: ["candidate"] }
);
