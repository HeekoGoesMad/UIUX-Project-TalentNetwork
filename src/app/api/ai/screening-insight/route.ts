import { NextResponse } from "next/server";
import { screening } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth({ allowedRoles: ["recruiter", "admin"] });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (process.env.DATABASE_URL && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== "true") {
    return NextResponse.json(
      { error: "Gunakan endpoint screening run resmi agar consent dan charge token tervalidasi." },
      { status: 409 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data screening tidak valid." }, { status: 400 });
    }

    if (body.consent !== true) {
      return NextResponse.json({ error: "Consent kandidat diperlukan sebelum screening." }, { status: 403 });
    }

    const result = await screening(body.profile);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal memproses insight screening.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
