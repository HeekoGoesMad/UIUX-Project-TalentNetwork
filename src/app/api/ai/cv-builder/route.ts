import { NextResponse } from "next/server";
import { cvBuilder } from "@/lib/ai/provider";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";

export async function POST(request: Request) {
  const access = await requireApiAccess("candidate");
  if (!isApiAccess(access)) return accessResponse(access);
  try {
    return withAccessMode(NextResponse.json(await cvBuilder(await request.json())), access);
  } catch {
    return NextResponse.json({ error: "CV context tidak valid." }, { status: 400 });
  }
}
