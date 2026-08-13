export type CareerStatus =
  | "open-to-work"
  | "open-for-opportunities"
  | "freelance-available"
  | "internship-available"
  | "not-available";

export const CAREER_STATUS_CONFIG: Record<CareerStatus, { label: string; color: string; dot: string; emoji: string }> = {
  "open-to-work": { label: "Open to Work", color: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", emoji: "🟢" },
  "open-for-opportunities": { label: "Open for Opportunities", color: "bg-amber-100 text-amber-800", dot: "bg-amber-500", emoji: "🟡" },
  "freelance-available": { label: "Freelance Available", color: "bg-sky-100 text-sky-800", dot: "bg-sky-500", emoji: "🔵" },
  "internship-available": { label: "Internship Available", color: "bg-purple-100 text-purple-800", dot: "bg-purple-500", emoji: "🟣" },
  "not-available": { label: "Not Available", color: "bg-slate-100 text-slate-700", dot: "bg-slate-500", emoji: "⚫" },
};

export type TalentCategory = "djoin-verified" | "public";

export const TALENT_CATEGORY_CONFIG: Record<TalentCategory, { label: string; badge: string; description: string; color: string; badgeBg: string }> = {
  "djoin-verified": {
    label: "DJoin Verified Talent",
    badge: "🏅",
    description: "Pernah dibina Djoin, memiliki histori evaluasi & rekam jejak performa",
    color: "text-amber-800",
    badgeBg: "bg-amber-50 border border-amber-200 text-amber-800",
  },
  "public": {
    label: "Public Talent",
    badge: "👤",
    description: "Registrasi mandiri, Career Fair, Campus Partnership, atau Referral",
    color: "text-slate-600",
    badgeBg: "bg-slate-50 border border-slate-200 text-slate-600",
  },
};

export type IndustryCategory =
  | "human-capital"
  | "marketing-digital"
  | "product-design"
  | "sales-bizdev"
  | "data-analytics"
  | "technology-software";

export const INDUSTRY_CATEGORY_CONFIG: Record<IndustryCategory, { label: string }> = {
  "human-capital": { label: "Human Capital / HR" },
  "marketing-digital": { label: "Marketing / Digital" },
  "product-design": { label: "Product / Design" },
  "sales-bizdev": { label: "Sales / Business Development" },
  "data-analytics": { label: "Data / Analytics" },
  "technology-software": { label: "Technology / Software" },
};

export type Candidate = {
  id: string; name: string; initials: string; role: string; location: string; experience: number;
  availability: string; skills: string[]; tools: string[]; education: string; salary: string; summary: string;
  endorsements: string[]; certifications: string[]; portfolio: string[]; email: string; phone: string;
  linkedin: string;
  history: { company: string; role: string; years: string }[];
  careerStatus?: CareerStatus;
  talentCategory: TalentCategory;
  industry: IndustryCategory;
};
export type Scan = { candidateId: string; scannedAt: string };
export type ScreeningInsight = { score: number; label: string; coverage: number; evidence: string[]; limitations: string[]; followUp: string; modelVersion: string; source: "mock" | "azure" };
export type AiSummary = { summary: string; strengths: string[]; evidence: string[]; limitations: string[]; modelVersion: string; source: "mock" | "azure" };
export type ScreeningResult = { insight: ScreeningInsight; summary: AiSummary; fetchedAt: string };
export type ContactRequestHistory = { state: ConsentState; at: string };
export type ContactRequest = {
  candidateId: string;
  recruiterName?: string;
  company?: string;
  email?: string;
  requestedAt?: string;
  history?: ContactRequestHistory[];
};
export type AppState = { tokens: number; scans: Scan[]; shortlisted: string[]; notes: Record<string, string>; recentlyViewed: string[]; screeningTokens: number; previewsUsed: number; screeningConsents: Record<string, ConsentState>; screeningResults: Record<string, ScreeningResult>; contactRequests: Record<string, ContactRequest>; cvProfile: CvProfile | null; careerStatus: CareerStatus };
export type UserRole = "candidate" | "recruiter";
export type ProvisioningStatus = "pending" | "active" | "rejected";
export type DemoUser = { name: string; email: string; role: UserRole; provisioningStatus: ProvisioningStatus; companyName?: string };

export type CvProfile = {
  id: string;
  fullName: string;
  headline: string;
  about: string;
  location: string;
  email: string;
  phone: string;
  skills: string[];
  tools: string[];
  industries: string[];
  experience: { company: string; role: string; dates: string; achievements: string[] }[];
  education: { school: string; program: string; dates: string }[];
  certifications: string[];
  portfolio: string[];
  targetRole: string;
  workArrangement: "remote" | "hybrid" | "onsite";
  openToWork: boolean;
  careerStatus: CareerStatus;
  sourceFileName?: string;
  updatedAt: string;
};

export type ConsentState = "not-requested" | "pending-candidate-consent" | "consented" | "declined" | "consent-expired" | "withdrawn" | "screening-in-progress" | "screening-completed" | "disputed";
