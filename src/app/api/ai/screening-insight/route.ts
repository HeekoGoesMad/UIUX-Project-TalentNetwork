import { NextResponse } from "next/server";
import { screening } from "@/lib/ai/provider";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";

export async function POST(request: Request) {
  const access = await requireApiAccess("recruiter");
  if (!isApiAccess(access)) return accessResponse(access);
  if (process.env.DATABASE_URL && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS !== "true") {
    return NextResponse.json({ error: "Gunakan endpoint screening run agar consent dan charge token tervalidasi." }, { status: 409 });
  }
  try {
    const body = await request.json();
    if (body.consent !== true) return NextResponse.json({ error: "Consent kandidat diperlukan sebelum screening." }, { status: 403 });
    return withAccessMode(NextResponse.json(await screening(body.profile)), access);
  } catch {
    return NextResponse.json({ error: "Screening context tidak valid." }, { status: 400 });
  }
}
