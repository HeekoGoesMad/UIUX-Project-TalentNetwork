import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import { serializeCandidate } from "@/lib/services/talent-search";

export async function GET(_request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  try {
    const current = await getCurrentAppUser();
    const db = "error" in current ? getDb() : current.db;

    const [[row], sections] = await Promise.all([
      db
        .select({
          id: schema.candidateProfiles.id,
          name: schema.profiles.displayName,
          role: schema.candidateProfiles.headline,
          targetRole: schema.candidateProfiles.targetRole,
          location: schema.candidateProfiles.location,
          summary: schema.candidateProfiles.summary,
          isPublished: schema.candidateProfiles.isPublished,
          email: schema.users.email,
          phone: schema.profiles.phone,
          avatarUrl: schema.profiles.avatarUrl,
        })
        .from(schema.candidateProfiles)
        .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
        .leftJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
        .where(and(eq(schema.candidateProfiles.id, candidateId), eq(schema.candidateProfiles.isPublished, true)))
        .limit(1),
      db
        .select({
          candidateProfileId: schema.candidateProfileSections.candidateProfileId,
          type: schema.candidateProfileSections.type,
          content: schema.candidateProfileSections.content,
        })
        .from(schema.candidateProfileSections)
        .where(eq(schema.candidateProfileSections.candidateProfileId, candidateId)),
    ]);

    if (!row) {
      return NextResponse.json({ error: "Profil kandidat tidak ditemukan atau belum dipublikasikan." }, { status: 404 });
    }

    const candidate = serializeCandidate(row, sections);
    return NextResponse.json({ candidate });
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
