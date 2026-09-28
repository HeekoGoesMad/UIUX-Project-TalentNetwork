import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/api/auth";

export const dynamic = "force-dynamic";

const recommendSchema = z.object({
  institution: z.string().min(2, "Nama institusi wajib diisi"),
  program: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recommendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data rekomendasi tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { institution, program, notes } = parsed.data;
    const authResult = await getCurrentAppUser({ allowPending: true });
    const userEmail = "error" in authResult ? "anonymous" : authResult.user.email;

    console.info(`[Campus Recommendation] Candidate ${userEmail} merekomendasikan:`, {
      institution,
      program,
      notes,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Terima kasih! Rekomendasi untuk ${institution} berhasil dicatat. Tim ProofyLink akan memprioritaskan komunikasi kemitraan dengan pihak kampus Anda.`,
    });
  } catch (error) {
    console.error("Gagal menyimpan rekomendasi kampus:", error);
    return NextResponse.json({ error: "Gagal menyimpan rekomendasi." }, { status: 500 });
  }
}
