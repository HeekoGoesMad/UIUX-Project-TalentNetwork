import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { schema, type Database } from "@/db";
import {
  asCareerStatus,
  type CampusVerification,
  type Candidate,
  type CandidatePersonality,
  type IndustryCategory,
  type TalentCategory,
} from "@/types";

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
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  },
  sections: Section[]
): Candidate {
  const sectionMap = new Map<string, Record<string, unknown>>();
  for (const s of sections) {
    sectionMap.set(s.type, s.content);
  }

  const getItems = <T,>(type: string): T[] => {
    const items = sectionMap.get(type)?.items;
    return Array.isArray(items) ? (items as T[]) : [];
  };

  const skills = getItems<string>("skills");
  const tools = getItems<string>("tools");
  const experience = getItems<{
    company: string;
    role: string;
    dates?: string;
    achievements?: string[];
  }>("experience");
  const education = getItems<{ school: string; program: string; dates?: string }>("education");
  const preferences = sectionMap.get("preferences") ?? {};
  const status = asCareerStatus(preferences.careerStatus);
  const salary = typeof preferences.salary === "string" && preferences.salary.trim() ? preferences.salary.trim() : "Belum dicantumkan";
  const personality = preferences.personality && typeof preferences.personality === "object"
    ? (preferences.personality as CandidatePersonality)
    : undefined;
  const talentCategory = typeof preferences.talentCategory === "string"
    ? (preferences.talentCategory as TalentCategory)
    : ("public" as TalentCategory);
  const campusVerification = preferences.campusVerification && typeof preferences.campusVerification === "object"
    ? (preferences.campusVerification as CampusVerification)
    : undefined;

  const portfolio = getSectionItems<string>(sections, "portfolio");
  const linkedinFromPortfolio = portfolio.find((url) => typeof url === "string" && url.toLowerCase().includes("linkedin.com"));
  const linkedin =
    (typeof preferences.linkedinUrl === "string" && preferences.linkedinUrl.trim())
      ? preferences.linkedinUrl.trim()
      : linkedinFromPortfolio
      ? linkedinFromPortfolio
      : `https://linkedin.com/in/${(row.name || "talent").toLowerCase().replaceAll(" ", "-")}`;

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
    salary,
    personality,
    campusVerification,
    summary: row.summary?.trim() || "Profil kandidat belum memiliki ringkasan.",
    endorsements: [],
    certifications: [],
    portfolio,
    email: row.email?.trim() || "",
    phone: row.phone?.trim() || "",
    linkedin,
    avatarUrl:
      row.avatarUrl?.trim() ||
      (typeof preferences.avatarUrl === "string" && preferences.avatarUrl.trim()
        ? preferences.avatarUrl.trim()
        : `https://images.unsplash.com/photo-${
            [
              "1534528741775-53994a69daeb",
              "1507003211169-0a1dd7228f2d",
              "1494790108377-be9c29b29330",
              "1500648767791-00dcc994a43e",
              "1573496359142-b8d87734a5a2",
              "1472099645785-5658abf4ff4e",
              "1580489944761-15a19d654956",
              "1519085360753-af0119f7cbe7",
            ][(row.id.charCodeAt(0) + row.id.length) % 8]
          }?q=80&w=400&auto=format&fit=crop`),
    bannerUrl:
      (typeof preferences.bannerUrl === "string" && preferences.bannerUrl.trim()
        ? preferences.bannerUrl.trim()
        : `https://images.unsplash.com/photo-${
            [
              "1618005182384-a83a8bd57fbe",
              "1579546929518-9e396f3cc809",
              "1557683316-973673baf926",
              "1550745165-9bc0b252726f",
              "1522071820081-009f0129c71c",
              "1497215728101-856f4ea42174",
              "1557804506-669a67965ba0",
              "1507679799987-c73779587ccf",
            ][(row.id.charCodeAt(row.id.length - 1) + row.id.length) % 8]
          }?q=80&w=1600&auto=format&fit=crop`),
    history: experience.map((item) => ({
      company: item.company,
      role: item.role,
      years: item.dates ?? "",
    })),
    careerStatus: status,
    talentCategory,
    industry: "technology-software" as IndustryCategory,
  };
}

export type TalentSearchParams = {
  q?: string;
  page?: number;
  limit?: number;
  locations?: string[];
  sort?: "relevance" | "name";
};

export class TalentSearchService {
  /**
   * Search published candidates with server-side filtering, keyword matching, and pagination.
   */
  static async search(db: Database, params?: TalentSearchParams) {
    const conditions: SQL[] = [eq(schema.candidateProfiles.isPublished, true)];

    const query = params?.q?.trim();
    if (query) {
      const searchPattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
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

    // Always paginated: default limit 24, capped at 100 so direct callers can never trigger unbounded scans.
    const rawPage = Number(params?.page ?? 1);
    const rawLimit = Number(params?.limit ?? 24);
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 24;
    const offset = (page - 1) * limit;

    let orderBy: SQL;
    if (params?.sort === "name") {
      orderBy = asc(schema.profiles.displayName);
    } else {
      orderBy = desc(schema.candidateProfiles.updatedAt);
    }

    // Run count and paginated slice queries concurrently
    const countQuery = db
      .select({ count: count() })
      .from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(whereClause);

    const sliceQuery = db
      .select({
        id: schema.candidateProfiles.id,
        name: schema.profiles.displayName,
        role: schema.candidateProfiles.headline,
        location: schema.candidateProfiles.location,
        summary: schema.candidateProfiles.summary,
        email: schema.users.email,
        phone: schema.profiles.phone,
        avatarUrl: schema.profiles.avatarUrl,
      })
      .from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .leftJoin(schema.users, eq(schema.users.id, schema.candidateProfiles.userId))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [[totalResult], rows] = await Promise.all([countQuery, sliceQuery]);
    const total = Number(totalResult?.count ?? 0);

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

    const sectionsByCandidateId = new Map<string, Section[]>();
    for (const section of sections) {
      let list = sectionsByCandidateId.get(section.candidateProfileId);
      if (!list) {
        list = [];
        sectionsByCandidateId.set(section.candidateProfileId, list);
      }
      list.push(section);
    }

    const candidates = rows.map((row) =>
      serializeCandidate(
        row,
        sectionsByCandidateId.get(row.id) ?? []
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
