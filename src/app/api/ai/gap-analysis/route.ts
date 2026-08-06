import { NextResponse } from "next/server";
import { gapAnalysis } from "@/lib/ai/provider";
export async function POST(request: Request) { try { return NextResponse.json(await gapAnalysis(await request.json())); } catch { return NextResponse.json({ error: "Profile context tidak valid." }, { status: 400 }); } }
