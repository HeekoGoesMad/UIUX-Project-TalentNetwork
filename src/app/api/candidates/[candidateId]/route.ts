import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { serializeCandidate } from "@/lib/services/talent-search";

export async function GET(_request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [row] = await current.db
      .select({
        id: schema.candidateProfiles.id,
        name: schema.profiles.displayName,
        role: schema.candidateProfiles.headline,
        location: schema.candidateProfiles.location,
        summary: schema.candidateProfiles.summary,
        isPublished: schema.candidateProfiles.isPublished,
      })
      .from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(and(eq(schema.candidateProfiles.id, candidateId), eq(schema.candidateProfiles.isPublished, true)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Profil kandidat tidak ditemukan atau belum dipublikasikan." }, { status: 404 });
    }

    const sections = await current.db
      .select({
        candidateProfileId: schema.candidateProfileSections.candidateProfileId,
        type: schema.candidateProfileSections.type,
        content: schema.candidateProfileSections.content,
      })
      .from(schema.candidateProfileSections)
      .where(eq(schema.candidateProfileSections.candidateProfileId, row.id));

    const candidate = serializeCandidate(row, sections);
    return NextResponse.json({ candidate });
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
