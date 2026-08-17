import { NextResponse } from "next/server";
import { summary } from "@/lib/ai/provider";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = await request.json();
    const strict = url.searchParams.get("strict") === "true" || body?.strict === true;
    const res = await summary(body, { strict });
    return NextResponse.json(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile context tidak valid.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

