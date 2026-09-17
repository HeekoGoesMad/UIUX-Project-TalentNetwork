import { NextResponse } from "next/server";
import { extractCvDocument } from "@/lib/ai/provider";
import { getCurrentAppUser } from "@/lib/api/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const current = await getCurrentAppUser();
  if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

  const rate = enforceRateLimit(`cv-import:${current.user.id}`, RATE_LIMITS.cvImport.limit, RATE_LIMITS.cvImport.windowMs);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Berkas tidak ditemukan dalam permintaan." }, { status: 400 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(file.name);

  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Upload hanya menerima berkas PDF atau gambar (PNG, JPG, WEBP)." },
      { status: 415 }
    );
  }

  if (file.size > 10_000_000) {
    return NextResponse.json({ error: "Ukuran berkas maksimal 10 MB." }, { status: 413 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extracted = await extractCvDocument(
      {
        buffer,
        fileName: file.name,
        mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
      },
      { strict: true }
    );

    return NextResponse.json({
      cvId: crypto.randomUUID(),
      ...extracted,
    });
  } catch (err: unknown) {
    console.error("[POST /api/cv/import] Error:", err);
    const message = err instanceof Error ? err.message : "Gagal memproses dokumen CV.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

