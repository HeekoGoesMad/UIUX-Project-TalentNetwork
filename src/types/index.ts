export type CareerStatus =
  | "open-to-work"
  | "open-for-opportunities"
  | "freelance-available"
  | "internship-available"
  | "not-available";

export type TalentCategory = "djoin-verified" | "public";

export type IndustryCategory =
  | "human-capital"
  | "marketing-digital"
  | "product-design"
  | "sales-bizdev"
  | "data-analytics"
  | "technology-software";

export {
  CAREER_STATUS_CONFIG,
  TALENT_CATEGORY_CONFIG,
  INDUSTRY_CATEGORY_CONFIG,
} from "@/config/talent";


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
export type ScreeningInsight = { score: number; label: string; coverage: number; evidence: string[]; limitations: string[]; followUp: string; modelVersion: string; source: "mock" | "azure" | "local" };
export type AiSummary = { summary: string; strengths: string[]; evidence: string[]; limitations: string[]; modelVersion: string; source: "mock" | "azure" | "local" };
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
export type AppState = { tokens: number; scans: Scan[]; shortlisted: string[]; notes: Record<string, string>; recentlyViewed: string[]; screeningTokens: number; previewsUsed: number; screeningConsents: Record<string, ConsentState>; screeningResults: Record<string, ScreeningResult>; contactRequests?: Record<string, ContactRequest>; cvProfile: CvProfile | null; careerStatus: CareerStatus };
export type UserRole = "candidate" | "recruiter" | "partner";
export type ProvisioningStatus = "pending" | "active" | "rejected";
export type DemoUser = { name: string; email: string; role: UserRole; provisioningStatus?: ProvisioningStatus; companyName?: string };

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
