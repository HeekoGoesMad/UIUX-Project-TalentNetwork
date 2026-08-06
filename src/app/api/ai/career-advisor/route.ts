import { NextResponse } from "next/server";
import { careerAdvisor } from "@/lib/ai/provider";
export async function POST(request: Request) { try { return NextResponse.json(await careerAdvisor(await request.json())); } catch { return NextResponse.json({ error: "Profile context tidak valid." }, { status: 400 }); } }
