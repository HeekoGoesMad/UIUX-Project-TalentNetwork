import { NextResponse } from "next/server";
import { interviewQuestions } from "@/lib/ai/provider";
export async function POST(request: Request) { try { return NextResponse.json(await interviewQuestions(await request.json())); } catch { return NextResponse.json({ error: "Role context tidak valid." }, { status: 400 }); } }
