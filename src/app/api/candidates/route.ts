import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";

import { schema } from "@/db";
import { getCurrentAppUser } from "@/lib/api/auth";
import type { Candidate, CareerStatus, IndustryCategory, TalentCategory } from "@/types";

type Section = { candidateProfileId: string; type: string; content: Record<string, unknown> };

function items<T>(sections: Section[], type: string): T[] {
  const value = sections.find((section) => section.type === type)?.content.items;
  return Array.isArray(value) ? value as T[] : [];
}

function toCandidate(row: { id: string; name: string | null; role: string | null; location: string | null; summary: string | null }, sections: Section[]): Candidate {
  const skills = items<string>(sections, "skills");
  const tools = items<string>(sections, "tools");
  const experience = items<{ company: string; role: string; dates?: string; achievements?: string[] }>(sections, "experience");
  const education = items<{ school: string; program: string; dates?: string }>(sections, "education");
  const preferences = sections.find((section) => section.type === "preferences")?.content ?? {};
  const careerStatus = preferences.careerStatus;
  const status: CareerStatus = typeof careerStatus === "string" && ["open-to-work", "open-for-opportunities", "freelance-available", "internship-available", "not-available"].includes(careerStatus)
    ? careerStatus as CareerStatus : "open-to-work";
  const name = row.name?.trim() || "Kandidat anonim";

  return {
    id: row.id,
    name,
    initials: name.split(" ").map((part) => part[0]).join("").slice(0, 3),
    role: row.role?.trim() || "Role belum tersedia",
    location: row.location?.trim() || "Lokasi belum tersedia",
     experience: experience.length,
    availability: status === "not-available" ? "Tidak tersedia" : "Terbuka untuk peluang",
    skills,
    tools,
     education: education.map((item) => [item.school, item.program].filter(Boolean).join(" · ")).filter(Boolean).join(", "),
    salary: "Belum dicantumkan",
    summary: row.summary?.trim() || "Profil kandidat belum memiliki ringkasan.",
    endorsements: [],
    certifications: [],
    portfolio: items<string>(sections, "portfolio"),
    email: "",
    phone: "",
    linkedin: "",
    history: experience.map((item) => ({ company: item.company, role: item.role, years: item.dates ?? "" })),
    careerStatus: status,
    talentCategory: "public" as TalentCategory,
    industry: "technology-software" as IndustryCategory,
  };
}

export async function GET() {
  try {
    const current = await getCurrentAppUser();
    if ("error" in current) return NextResponse.json({ error: current.error }, { status: current.status });
    const rows = await current.db.select({
      id: schema.candidateProfiles.id,
      name: schema.profiles.displayName,
      role: schema.candidateProfiles.headline,
      location: schema.candidateProfiles.location,
      summary: schema.candidateProfiles.summary,
    }).from(schema.candidateProfiles)
      .leftJoin(schema.profiles, eq(schema.profiles.userId, schema.candidateProfiles.userId))
      .where(eq(schema.candidateProfiles.isPublished, true));
    const sections = rows.length === 0 ? [] : await current.db.select({
      candidateProfileId: schema.candidateProfileSections.candidateProfileId,
      type: schema.candidateProfileSections.type,
      content: schema.candidateProfileSections.content,
    }).from(schema.candidateProfileSections).where(inArray(schema.candidateProfileSections.candidateProfileId, rows.map((row) => row.id)));
    return NextResponse.json({ candidates: rows.map((row) => toCandidate(row, sections.filter((section) => section.candidateProfileId === row.id))) });
  } catch {
    return NextResponse.json({ error: "Data kandidat belum dapat dimuat." }, { status: 503 });
  }
}
