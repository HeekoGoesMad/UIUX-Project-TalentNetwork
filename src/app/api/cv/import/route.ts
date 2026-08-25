import { NextResponse } from "next/server";
import { importCv } from "@/lib/ai/provider";
import { getCurrentAppUser } from "@/lib/api/auth";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/api/rate-limit";

export async function POST(request: Request) {
  const current = await getCurrentAppUser();
  if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
  const rate = enforceRateLimit(`cv-import:${current.user.id}`, RATE_LIMITS.cvImport.limit, RATE_LIMITS.cvImport.windowMs);
  if (!rate.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File) || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) return NextResponse.json({ error: "Upload hanya menerima file PDF." }, { status: 415 }); if (file.size > 5_000_000) return NextResponse.json({ error: "Ukuran PDF maksimal 5 MB." }, { status: 413 }); return NextResponse.json({ cvId: crypto.randomUUID(), ...importCv(file.name) });
}
