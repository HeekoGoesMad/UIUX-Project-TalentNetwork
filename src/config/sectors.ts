import type { IndustryCategory, Candidate } from "@/types";

export interface SectorConfig {
  label: string;
  subRolePreview: string; // Ringkasan posisi untuk subtitle filter di sidebar
  subRoles: string[];     // Daftar posisi standar dalam sektor ini
  keywords: string[];     // Kata kunci pencarian case-insensitive pada role & targetRole
}

export const SECTOR_TAXONOMY: Record<IndustryCategory, SectorConfig> = {
  "technology-software": {
    label: "Technology / Software",
    subRolePreview: "Frontend, Backend, Mobile, DevOps, QA, Cloud",
    subRoles: [
      "Frontend Engineer",
      "Backend Engineer",
      "Fullstack Developer",
      "DevOps Engineer",
      "Mobile Developer",
      "QA Engineer",
      "Software Architect",
      "Cloud Engineer",
      "Cybersecurity Specialist",
      "Tech Lead",
    ],
    keywords: [
      "frontend",
      "front-end",
      "backend",
      "back-end",
      "fullstack",
      "full-stack",
      "software",
      "engineer",
      "developer",
      "devops",
      "qa",
      "quality assurance",
      "tester",
      "testing",
      "mobile",
      "ios",
      "android",
      "react",
      "flutter",
      "golang",
      "python",
      "cloud",
      "security",
      "web",
      "system",
      "tech lead",
    ],
  },
  "product-design": {
    label: "Product / Design",
    subRolePreview: "UI/UX, Product Designer, PM, UX Researcher",
    subRoles: [
      "Senior Product Designer",
      "UI/UX Designer",
      "Product Manager",
      "Associate Product Manager",
      "UX Researcher",
      "Interaction Designer",
      "Design System Lead",
      "Product Owner",
      "Visual Designer",
    ],
    keywords: [
      "product design",
      "product designer",
      "ui/ux",
      "ui designer",
      "ux designer",
      "product manager",
      "product management",
      "product owner",
      "ux researcher",
      "ux research",
      "user research",
      "design system",
      "interaction design",
      "visual designer",
      "desain",
      "design",
      "figma",
    ],
  },
  "data-analytics": {
    label: "Data / Analytics",
    subRolePreview: "Data Scientist, Data Analyst, BI, Data Engineer",
    subRoles: [
      "Data Scientist",
      "Data Analyst",
      "Data Engineer",
      "Business Intelligence Analyst",
      "Machine Learning Engineer",
      "AI Engineer",
      "Analytics Specialist",
    ],
    keywords: [
      "data scientist",
      "data analyst",
      "data engineer",
      "analytics",
      "business intelligence",
      "bi analyst",
      "machine learning",
      "deep learning",
      "ai engineer",
      "statistician",
      "big data",
      "data",
      "sql",
      "power bi",
      "tableau",
    ],
  },
  "marketing-digital": {
    label: "Marketing / Digital",
    subRolePreview: "Growth, SEO/SEM, Content, Brand Strategist",
    subRoles: [
      "Growth Marketing Lead",
      "Digital Marketing Specialist",
      "SEO / SEM Specialist",
      "Content Strategist",
      "Brand Strategist",
      "Social Media Specialist",
      "Performance Marketer",
      "Copywriter",
    ],
    keywords: [
      "marketing",
      "growth",
      "digital marketing",
      "seo",
      "sem",
      "content",
      "brand",
      "copywriter",
      "social media",
      "performance market",
      "campaign",
      "pemasaran",
      "advertising",
      "ads",
    ],
  },
  "sales-bizdev": {
    label: "Sales / Business Development",
    subRolePreview: "Business Development, Account Executive, Sales",
    subRoles: [
      "Business Development Manager",
      "Account Executive",
      "Sales Manager",
      "Partnership Lead",
      "Enterprise Sales",
      "Sales Development Representative (SDR)",
      "Key Account Manager",
    ],
    keywords: [
      "business development",
      "bizdev",
      "sales",
      "account executive",
      "partnership",
      "b2b",
      "sdr",
      "bdr",
      "key account",
      "client acquisition",
      "penjualan",
      "commercial",
    ],
  },
  "human-capital": {
    label: "Human Capital / HR",
    subRolePreview: "HR Generalist, Talent Acquisition, People Ops",
    subRoles: [
      "HR Generalist",
      "Talent Acquisition Specialist",
      "People Operations Specialist",
      "Technical Recruiter",
      "HR Business Partner (HRBP)",
      "People & Culture Specialist",
      "Compensation & Benefits Specialist",
    ],
    keywords: [
      "human capital",
      "human resources",
      "hr",
      "hrbp",
      "talent acquisition",
      "recruiter",
      "recruitment",
      "people ops",
      "people operations",
      "people & culture",
      "personalia",
      "sdm",
      "hiring",
      "talent",
    ],
  },
};

/**
 * Memeriksa apakah kandidat cocok dengan salah satu sektor yang dipilih.
 * Mencocokkan via:
 * 1. candidate.industry eksplisit
 * 2. Role / targetRole kandidat dengan kata kunci taksonomi sektor
 * 3. Skill unggulan kandidat dengan kata kunci sektor
 */
export function candidateMatchesSector(candidate: Candidate, sectorKey: IndustryCategory): boolean {
  // 1. Explicit industry match
  if (candidate.industry === sectorKey) return true;

  const cfg = SECTOR_TAXONOMY[sectorKey];
  if (!cfg) return false;

  const candidateText = `${candidate.role} ${candidate.targetRole ?? ""} ${candidate.skills.join(" ")}`.toLowerCase();

  // 2. Keyword match
  return cfg.keywords.some((kw) => candidateText.includes(kw));
}

/**
 * Menginferensikan sektor industri terbaik dari judul peran (role atau targetRole).
 * Berguna saat data candidate di DB tidak memiliki field industry eksplisit.
 */
export function inferSectorFromRole(roleOrTargetRole?: string | null): IndustryCategory {
  if (!roleOrTargetRole) return "technology-software";
  const text = roleOrTargetRole.toLowerCase();

  // Urutan prioritas inferensi spesifik
  // 1. HR / Human Capital
  if (
    text.includes("human") ||
    text.includes("hr") ||
    text.includes("recruiter") ||
    text.includes("talent acquisition") ||
    text.includes("people ops") ||
    text.includes("personalia")
  ) {
    return "human-capital";
  }

  // 2. Data / Analytics
  if (
    text.includes("data") ||
    text.includes("analyst") ||
    text.includes("analytics") ||
    text.includes("machine learning") ||
    text.includes("bi ") ||
    text.includes("intelligence")
  ) {
    return "data-analytics";
  }

  // 3. Product / Design
  if (
    text.includes("product") ||
    text.includes("design") ||
    text.includes("ui") ||
    text.includes("ux") ||
    text.includes("figma") ||
    text.includes("researcher")
  ) {
    return "product-design";
  }

  // 4. Marketing / Digital
  if (
    text.includes("market") ||
    text.includes("growth") ||
    text.includes("seo") ||
    text.includes("sem") ||
    text.includes("content") ||
    text.includes("copywriter") ||
    text.includes("brand")
  ) {
    return "marketing-digital";
  }

  // 5. Sales / Business Development
  if (
    text.includes("sales") ||
    text.includes("business dev") ||
    text.includes("bizdev") ||
    text.includes("account executive") ||
    text.includes("partnership")
  ) {
    return "sales-bizdev";
  }

  // 6. Technology / Software (default tech)
  return "technology-software";
}
