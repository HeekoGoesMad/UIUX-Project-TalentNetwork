import { NextResponse } from "next/server";
import { summary } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data ringkasan profil tidak valid." }, { status: 400 });
    }

    const strict = url.searchParams.get("strict") === "true" || body?.strict === true;
    const res = await summary(body, { strict });
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghasilkan ringkasan profil AI.";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && error.message.includes("Konfigurasi") ? 503 : 400 }
    );
  }
}
