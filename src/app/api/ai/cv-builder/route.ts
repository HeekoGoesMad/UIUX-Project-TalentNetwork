import { NextResponse } from "next/server";
import { cvBuilder } from "@/lib/ai/provider";
export async function POST(request: Request) { try { return NextResponse.json(await cvBuilder(await request.json())); } catch { return NextResponse.json({ error: "CV context tidak valid." }, { status: 400 }); } }
