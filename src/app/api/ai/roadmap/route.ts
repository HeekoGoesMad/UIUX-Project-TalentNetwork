import { NextResponse } from "next/server";
import { roadmap } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth();
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data roadmap tidak valid." }, { status: 400 });
    }

    const result = await roadmap(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal memproses roadmap karier AI:", error);
    return NextResponse.json({ error: "Fitur AI belum dapat diproses. Coba lagi nanti." }, { status: 400 });
  }
}
