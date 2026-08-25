import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { schema, type Database } from "@/db";
import { asCareerStatus, type Candidate, type IndustryCategory, type TalentCategory } from "@/types";

type Section = { candidateProfileId: string; type: string; content: Record<string, unknown> };

function getSectionItems<T>(sections: Section[], type: string): T[] {
  const value = sections.find((section) => section.type === type)?.content.items;
  return Array.isArray(value) ? (value as T[]) : [];
}

export function serializeCandidate(
  row: {
    id: string;
    name: string | null;
    role: string | null;
    location: string | null;
    summary: string | null;
  },
  sections: Section[]
): Candidate {
  const skills = getSectionItems<string>(sections, "skills");
  const tools = getSectionItems<string>(sections, "tools");
  const experience = getSectionItems<{
    company: string;
    role: string;
    dates?: string;
    achievements?: string[];
  }>(sections, "experience");
  const education = getSectionItems<{ school: string; program: string; dates?: string }>(
    sections,
    "education"
  );
  const preferences = sections.find((section) => section.type === "preferences")?.content ?? {};
  const status = asCareerStatus(preferences.careerStatus);

  const name = row.name?.trim() || "Kandidat anonim";

  return {
    id: row.id,
    name,
    initials: name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 3),
    role: row.role?.trim() || "Role belum tersedia",
    location: row.location?.trim() || "Lokasi belum tersedia",
    experience: experience.length,
    availability: status === "not-available" ? "Tidak tersedia" : "Terbuka untuk peluang",
    skills,
    tools,
    education: education
      .map((item) => [item.school, item.program].filter(Boolean).join(" · "))
      .filter(Boolean)
      .join(", "),
    salary: "Belum dicantumkan",
    summary: row.summary?.trim() || "Profil kandidat belum memiliki ringkasan.",
    endorsements: [],
    certifications: [],
    portfolio: getSectionItems<string>(sections, "portfolio"),
    email: "",
    phone: "",
    linkedin: "",
    history: experience.map((item) => ({
      company: item.company,
      role: item.role,
      years: item.dates ?? "",
    })),
    careerStatus: status,
    talentCategory: "public" as TalentCategory,
    industry: "technology-software" as IndustryCategory,
  };
}

export type TalentSearchParams = {
  q?: string;
  page?: number;
  limit?: number;
  locations?: string[];
  sort?: "relevance" | "name" | "experience";
};

export class TalentSearchService {
  /**
   * Search published candidates with server-side filtering, keyword matching, and pagination.
   */
  static async search(db: Database, params?: TalentSearchParams) {
    const conditions: SQL[] = [eq(schema.candidateProfiles.isPublished, true)];

    const query = params?.q?.trim();
    if (query) {
      const searchPattern = `%${query}%`;
      conditions.push(
        or(
          ilike(schema.profiles.displayName, searchPattern),
          ilike(schema.candidateProfiles.headline, searchPattern),
          ilike(schema.candidateProfiles.location, searchPattern),
          ilike(schema.candidateProfiles.summary, searchPattern)
        )!
      );
    }

    if (params?.locations && params.locations.length > 0) {
      conditions.push(inArray(schema.candidateProfiles.location, params.locations));
    }

    const whereClause = and(...conditions);

    // Count total matches
    const [totalResult] = await db
      .select({ count: count() })
      .from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(whereClause);

    const total = Number(totalResult?.count ?? 0);

    // Determine pagination bounds
    const isPaginated = params?.page !== undefined || params?.limit !== undefined;
    const page = Math.max(1, Number(params?.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(params?.limit ?? 12)));
    const offset = (page - 1) * limit;

    let orderBy: SQL;
    if (params?.sort === "name") {
      orderBy = asc(schema.profiles.displayName);
    } else {
      orderBy = desc(schema.candidateProfiles.updatedAt);
    }

    // Select candidate slice
    const selectQuery = db
      .select({
        id: schema.candidateProfiles.id,
        name: schema.profiles.displayName,
        role: schema.candidateProfiles.headline,
        location: schema.candidateProfiles.location,
        summary: schema.candidateProfiles.summary,
      })
      .from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(whereClause)
      .orderBy(orderBy);

    const rows = isPaginated
      ? await selectQuery.limit(limit).offset(offset)
      : await selectQuery;

    if (rows.length === 0) {
      return {
        candidates: [],
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    // Batch query candidate profile sections in a single query
    const candidateIds = rows.map((row) => row.id);
    const sections = await db
      .select({
        candidateProfileId: schema.candidateProfileSections.candidateProfileId,
        type: schema.candidateProfileSections.type,
        content: schema.candidateProfileSections.content,
      })
      .from(schema.candidateProfileSections)
      .where(inArray(schema.candidateProfileSections.candidateProfileId, candidateIds));

    const candidates = rows.map((row) =>
      serializeCandidate(
        row,
        sections.filter((section) => section.candidateProfileId === row.id)
      )
    );

    return {
      candidates,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
