import { NextResponse } from "next/server";
import { importCv } from "@/lib/ai/provider";
import { accessResponse, isApiAccess, requireApiAccess, withAccessMode } from "@/lib/api/access";

export async function POST(request: Request) {
  const access = await requireApiAccess("candidate");
  if (!isApiAccess(access)) return accessResponse(access);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Upload tidak valid." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
    return NextResponse.json({ error: "Upload hanya menerima file PDF." }, { status: 415 });
  }
  if (file.size > 5_000_000) return NextResponse.json({ error: "Ukuran PDF maksimal 5 MB." }, { status: 413 });
  return withAccessMode(NextResponse.json({ cvId: crypto.randomUUID(), ...importCv(file.name) }), access);
}
