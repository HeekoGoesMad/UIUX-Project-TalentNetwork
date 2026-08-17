import { NextResponse } from "next/server";
import { z } from "zod";
import { summary } from "@/lib/ai/provider";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";

export async function POST(request: Request) {
  const access = await requireApiAccess("candidate");
  if (!isApiAccess(access)) return accessResponse(access);
  try {
    const url = new URL(request.url);
    const body = await request.json();
    const strict = url.searchParams.get("strict") === "true" || body?.strict === true;
    const res = await summary(body, { strict });
    return withAccessMode(NextResponse.json(res), access);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof z.ZodError ? "Profile context tidak valid." : "Layanan AI belum tersedia." },
      { status: error instanceof z.ZodError ? 400 : 503 },
    );
  }
}

