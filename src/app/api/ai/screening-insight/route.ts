import { NextResponse } from "next/server";
import { screening } from "@/lib/ai/provider";
export async function POST(request: Request) { try { const body = await request.json(); if (body.consent !== true) return NextResponse.json({ error: "Consent kandidat diperlukan sebelum screening." }, { status: 403 }); return NextResponse.json(await screening(body.profile)); } catch { return NextResponse.json({ error: "Screening context tidak valid." }, { status: 400 }); } }
