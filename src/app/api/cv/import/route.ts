import { NextResponse } from "next/server";
import { importCv } from "@/lib/ai/provider";
export async function POST(request: Request) { const form = await request.formData(); const file = form.get("file"); if (!(file instanceof File) || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) return NextResponse.json({ error: "Upload hanya menerima file PDF." }, { status: 415 }); if (file.size > 5_000_000) return NextResponse.json({ error: "Ukuran PDF maksimal 5 MB." }, { status: 413 }); return NextResponse.json({ cvId: crypto.randomUUID(), ...importCv(file.name) }); }
