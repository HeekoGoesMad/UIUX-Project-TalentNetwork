import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });

    const [profile] = await current.db.select({
      id: schema.profiles.id,
      displayName: schema.profiles.displayName,
      avatarUrl: schema.profiles.avatarUrl,
      phone: schema.profiles.phone,
      createdAt: schema.profiles.createdAt,
      updatedAt: schema.profiles.updatedAt,
    }).from(schema.profiles).where(eq(schema.profiles.userId, current.user.id)).limit(1);

    let candidateProfile;
    let sections: unknown[] = [];
    if (current.user.role === "candidate") {
      [candidateProfile] = await current.db.select().from(schema.candidateProfiles)
        .where(eq(schema.candidateProfiles.userId, current.user.id)).limit(1);
      if (candidateProfile) {
        sections = await current.db.select().from(schema.candidateProfileSections)
          .where(eq(schema.candidateProfileSections.candidateProfileId, candidateProfile.id));
      }
    }

    return NextResponse.json({
      user: { id: current.user.id, email: current.user.email, role: current.user.role },
      profile: profile ?? null,
      candidateProfile: candidateProfile ?? null,
      sections,
    });
  } catch {
    return NextResponse.json({ error: "Database tidak tersedia." }, { status: 503 });
  }
}
