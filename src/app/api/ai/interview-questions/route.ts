import { NextResponse } from "next/server";
import { interviewQuestions } from "@/lib/ai/provider";
import { getAiEndpointAuth } from "@/lib/api/ai-auth";

export async function POST(request: Request) {
  const auth = await getAiEndpointAuth({ allowedRoles: ["recruiter", "candidate", "admin"] });
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Data role context tidak valid." }, { status: 400 });
    }

    const result = await interviewQuestions(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menghasilkan pertanyaan wawancara AI.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
