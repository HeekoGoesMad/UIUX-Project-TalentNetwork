import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { PARTNER_CAMPUSES, type CampusVerification, type EducationItem } from "@/types";

export const dynamic = "force-dynamic";

const verifyActionSchema = z.object({
  candidateId: z.string().optional(),
  status: z.enum(["verified", "rejected", "pending"]),
  institution: z.string().optional(),
  batch: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const institutionParam = searchParams.get("institution")?.trim() || "all";
    const statusParam = searchParams.get("status")?.trim() || "all";

    // 1. Get all candidates in the system
    const candidateRows = await db
      .select({
        id: schema.candidateProfiles.id,
        userId: schema.candidateProfiles.userId,
        headline: schema.candidateProfiles.headline,
        targetRole: schema.candidateProfiles.targetRole,
        location: schema.candidateProfiles.location,
        isPublished: schema.candidateProfiles.isPublished,
        name: schema.profiles.displayName,
        avatarUrl: schema.profiles.avatarUrl,
        email: schema.users.email,
        updatedAt: schema.candidateProfiles.updatedAt,
      })
      .from(schema.candidateProfiles)
      .innerJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id));

    if (candidateRows.length === 0) {
      return NextResponse.json({
        talents: [],
        stats: { total: 0, verified: 0, pending: 0 },
        institutions: PARTNER_CAMPUSES.map((name) => ({ name, pendingCount: 0, totalCount: 0 })),
      });
    }

    const candidateIds = candidateRows.map((r) => r.id);

    // 2. Fetch sections for all candidate profiles
    const sections = await db
      .select()
      .from(schema.candidateProfileSections)
      .where(inArray(schema.candidateProfileSections.candidateProfileId, candidateIds));

    const sectionMap = new Map<string, Record<string, unknown>>();
    sections.forEach((sec) => {
      const key = `${sec.candidateProfileId}:${sec.type}`;
      sectionMap.set(key, (sec.content as Record<string, unknown>) || {});
    });

    // 3. Map candidates with their verification, education, and skills
    const rawTalents = candidateRows.map((c) => {
      const prefContent = sectionMap.get(`${c.id}:preferences`) || {};
      const eduContent = sectionMap.get(`${c.id}:education`) || {};
      const skillsContent = sectionMap.get(`${c.id}:skills`) || {};

      const campusVerification = (prefContent.campusVerification as CampusVerification | undefined) || null;
      const eduItems = ((eduContent.items as EducationItem[] | undefined) || []);
      const skills = ((skillsContent.items as string[] | undefined) || []);
      const primaryEdu = eduItems[0] || null;

      const institution = campusVerification?.institution || primaryEdu?.school || "Institusi Belum Tercantum";
      const program = campusVerification?.program || primaryEdu?.program || "Program Studi";
      const year = campusVerification?.year || primaryEdu?.dates || "2024";
      const status = campusVerification?.status || (primaryEdu ? "none" : "none");

      const name = c.name?.trim() || c.email.split("@")[0];
      const initials = name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      return {
        id: c.id,
        userId: c.userId,
        name,
        email: c.email,
        initials,
        avatarUrl: c.avatarUrl || null,
        institution,
        program,
        year,
        skills,
        status: status as "verified" | "pending" | "rejected" | "none",
        campusVerification,
        education: eduItems,
        updatedAt: c.updatedAt?.toISOString() || null,
        views: 1 + (c.id.charCodeAt(0) % 5),
      };
    });

    // 4. Compute institution stats
    const institutionStatsMap = new Map<string, { name: string; pendingCount: number; totalCount: number }>();

    // Seed default partner campuses
    PARTNER_CAMPUSES.forEach((camp) => {
      institutionStatsMap.set(camp.toLowerCase(), { name: camp, pendingCount: 0, totalCount: 0 });
    });

    // Aggregate from real candidates
    rawTalents.forEach((t) => {
      const institutionsToCredit = new Set<string>();
      if (t.institution && t.institution !== "Institusi Belum Tercantum") {
        institutionsToCredit.add(t.institution);
      }
      t.education.forEach((e) => {
        if (e.school?.trim()) institutionsToCredit.add(e.school.trim());
      });

      institutionsToCredit.forEach((instName) => {
        const key = instName.toLowerCase();
        let stat = institutionStatsMap.get(key);
        if (!stat) {
          stat = { name: instName, pendingCount: 0, totalCount: 0 };
          institutionStatsMap.set(key, stat);
        }
        stat.totalCount += 1;
        if (t.status === "pending") {
          stat.pendingCount += 1;
        }
      });
    });

    const institutionsList = Array.from(institutionStatsMap.values()).sort((a, b) => {
      // Prioritize campuses with pending verification requests
      if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
      return a.name.localeCompare(b.name);
    });

    // 5. Filter candidates according to query params
    const filteredTalents = rawTalents.filter((t) => {
      // Must have requested verification OR have an education entry matching
      const hasVerification = t.status === "pending" || t.status === "verified" || t.status === "rejected";

      // If filtering by institution
      if (institutionParam !== "all") {
        const instLower = institutionParam.toLowerCase();
        const matchesInstitution =
          t.institution.toLowerCase().includes(instLower) ||
          instLower.includes(t.institution.toLowerCase()) ||
          t.education.some((e) => e.school?.toLowerCase().includes(instLower) || instLower.includes(e.school?.toLowerCase() || ""));

        if (!matchesInstitution) return false;
      }

      // If filtering by status
      if (statusParam === "verified") return t.status === "verified";
      if (statusParam === "pending") return t.status === "pending";
      if (statusParam === "all") {
        // Show talents that either have an active verification request or belong to the selected institution
        return hasVerification || (institutionParam !== "all" && t.education.length > 0);
      }

      return true;
    });

    // Sort: Pending first, then Verified, then newest
    filteredTalents.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (b.status === "pending" && a.status !== "pending") return 1;
      return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    });

    // Stats
    const stats = {
      total: filteredTalents.length,
      verified: filteredTalents.filter((t) => t.status === "verified").length,
      pending: filteredTalents.filter((t) => t.status === "pending").length,
    };

    return NextResponse.json({
      talents: filteredTalents,
      stats,
      institutions: institutionsList,
    });
  } catch (error) {
    console.error("Gagal memuat talent mitra:", error);
    return NextResponse.json({ error: "Gagal memuat data talent mitra." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json().catch(() => null);
    const parsed = verifyActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload verifikasi tidak valid." }, { status: 400 });
    }

    const { candidateId, status, institution, batch } = parsed.data;
    const now = new Date();
    const nowIso = now.toISOString();

    if (batch && institution) {
      // Find all candidate profile sections for preferences
      const prefSections = await db
        .select({
          id: schema.candidateProfileSections.id,
          candidateProfileId: schema.candidateProfileSections.candidateProfileId,
          content: schema.candidateProfileSections.content,
          userId: schema.candidateProfiles.userId,
        })
        .from(schema.candidateProfileSections)
        .innerJoin(
          schema.candidateProfiles,
          eq(schema.candidateProfiles.id, schema.candidateProfileSections.candidateProfileId)
        )
        .where(eq(schema.candidateProfileSections.type, "preferences"));

      let count = 0;
      for (const section of prefSections) {
        const content = (section.content as Record<string, unknown>) || {};
        const verif = content.campusVerification as CampusVerification | undefined;

        if (
          verif &&
          verif.status === "pending" &&
          (verif.institution.toLowerCase().includes(institution.toLowerCase()) ||
            institution.toLowerCase().includes(verif.institution.toLowerCase()))
        ) {
          const updatedVerif: CampusVerification = {
            ...verif,
            status,
            verifiedAt: status === "verified" ? nowIso : undefined,
            verifiedBy: status === "verified" ? `${institution} Career Center` : undefined,
          };

          await db
            .update(schema.candidateProfileSections)
            .set({
              content: { ...content, campusVerification: updatedVerif },
              updatedAt: now,
            })
            .where(eq(schema.candidateProfileSections.id, section.id));

          // Insert or update candidate_verifications table
          await db
            .insert(schema.candidateVerifications)
            .values({
              candidateProfileId: section.candidateProfileId,
              type: "education",
              status: status === "verified" ? "verified" : "revoked",
              provider: `${institution} Career Center`,
              evidence: { campusVerification: updatedVerif },
              verifiedAt: status === "verified" ? now : null,
              updatedAt: now,
            })
            .catch(() => {});

          // Add candidate notification
          await db
            .insert(schema.notifications)
            .values({
              userId: section.userId,
              type: "system",
              title: status === "verified" ? "Verifikasi Kampus Disetujui" : "Verifikasi Kampus Ditolak",
              body:
                status === "verified"
                  ? `Selamat! Profil Anda telah resmi diverifikasi oleh ${institution} Career Center. Badge resmi telah aktif di profil dan CV Anda.`
                  : `Pengajuan verifikasi institusi Anda untuk ${institution} belum dapat disetujui.`,
              data: { institution, status, verifiedAt: nowIso },
              createdAt: now,
            })
            .catch(() => {});

          count++;
        }
      }

      return NextResponse.json({ success: true, count, message: `${count} kandidat berhasil diperbarui.` });
    }

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId diperlukan." }, { status: 400 });
    }

    // Single candidate update
    const [profileSection] = await db
      .select({
        id: schema.candidateProfileSections.id,
        candidateProfileId: schema.candidateProfileSections.candidateProfileId,
        content: schema.candidateProfileSections.content,
        userId: schema.candidateProfiles.userId,
      })
      .from(schema.candidateProfileSections)
      .innerJoin(
        schema.candidateProfiles,
        eq(schema.candidateProfiles.id, schema.candidateProfileSections.candidateProfileId)
      )
      .where(
        eq(schema.candidateProfileSections.candidateProfileId, candidateId)
      )
      .limit(1);

    if (!profileSection) {
      return NextResponse.json({ error: "Profil kandidat tidak ditemukan." }, { status: 404 });
    }

    // Get preferences section or create it
    const [prefSection] = await db
      .select()
      .from(schema.candidateProfileSections)
      .where(
        and(
          eq(schema.candidateProfileSections.candidateProfileId, candidateId),
          eq(schema.candidateProfileSections.type, "preferences")
        )
      )
      .limit(1);

    const content = (prefSection?.content as Record<string, unknown>) || {};
    const existingVerif = (content.campusVerification as CampusVerification | undefined) || null;
    const resolvedInstitution = institution || existingVerif?.institution || "Institusi Mitra";

    const updatedVerif: CampusVerification = {
      institution: resolvedInstitution,
      program: existingVerif?.program || "Program Studi",
      year: existingVerif?.year || "2024",
      status,
      verifiedAt: status === "verified" ? nowIso : undefined,
      verifiedBy: status === "verified" ? `${resolvedInstitution} Career Center` : undefined,
    };

    if (prefSection) {
      await db
        .update(schema.candidateProfileSections)
        .set({
          content: { ...content, campusVerification: updatedVerif },
          updatedAt: now,
        })
        .where(eq(schema.candidateProfileSections.id, prefSection.id));
    } else {
      await db.insert(schema.candidateProfileSections).values({
        candidateProfileId: candidateId,
        type: "preferences",
        content: { campusVerification: updatedVerif },
        sortOrder: 10,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Insert or update candidate_verifications table
    await db
      .insert(schema.candidateVerifications)
      .values({
        candidateProfileId: candidateId,
        type: "education",
        status: status === "verified" ? "verified" : "revoked",
        provider: `${resolvedInstitution} Career Center`,
        evidence: { campusVerification: updatedVerif },
        verifiedAt: status === "verified" ? now : null,
        updatedAt: now,
      })
      .catch(() => {});

    // Add candidate notification
    await db
      .insert(schema.notifications)
      .values({
        userId: profileSection.userId,
        type: "system",
        title: status === "verified" ? "Verifikasi Kampus Disetujui" : "Verifikasi Kampus Ditolak",
        body:
          status === "verified"
            ? `Selamat! Profil Anda telah resmi diverifikasi oleh ${resolvedInstitution} Career Center. Badge resmi telah aktif di profil dan CV Anda.`
            : `Pengajuan verifikasi institusi Anda untuk ${resolvedInstitution} belum dapat disetujui.`,
        data: { institution: resolvedInstitution, status, verifiedAt: nowIso },
        createdAt: now,
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Status kandidat berhasil diubah menjadi ${status}.`,
      verification: updatedVerif,
    });
  } catch (error) {
    console.error("Gagal memproses verifikasi mitra:", error);
    return NextResponse.json({ error: "Gagal memperbarui verifikasi." }, { status: 500 });
  }
}
