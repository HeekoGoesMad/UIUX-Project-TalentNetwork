import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { GET as getCandidates } from "../route";

export async function GET(_request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const candidate = (await current.db.select({
      id: schema.candidateProfiles.id,
      name: schema.profiles.displayName,
      role: schema.candidateProfiles.headline,
      location: schema.candidateProfiles.location,
      summary: schema.candidateProfiles.summary,
      isPublished: schema.candidateProfiles.isPublished,
    }).from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.candidateProfiles.id, candidateId)).limit(1))[0];
    if (!candidate) return NextResponse.json({ error: "Profil kandidat tidak ditemukan." }, { status: 404 });
    if (!candidate.isPublished) return NextResponse.json({ error: "Profil kandidat tidak tersedia." }, { status: 404 });
    const response = await getCandidates();
    const payload = await response.json() as { candidates?: unknown[] };
    const remoteCandidate = payload.candidates?.find((item) => (item as { id?: string }).id === candidateId);
    return remoteCandidate ? NextResponse.json({ candidate: remoteCandidate }) : NextResponse.json({ error: "Profil kandidat tidak ditemukan." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
