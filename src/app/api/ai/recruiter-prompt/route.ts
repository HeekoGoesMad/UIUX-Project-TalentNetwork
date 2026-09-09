import { NextResponse } from "next/server";
import { recruiterOutreachPrompt } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth({ allowedRoles: ["recruiter", "admin"] });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data prompt rekruter tidak valid." }, { status: 400 });
    }

    const result = await recruiterOutreachPrompt(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal menghasilkan prompt pesan rekruter:", error);
    return NextResponse.json({ error: "Fitur AI prompt belum dapat diproses. Coba lagi nanti." }, { status: 400 });
  }
}
