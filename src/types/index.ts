export type Candidate = {
  id: string; name: string; initials: string; role: string; location: string; experience: number;
  availability: string; skills: string[]; education: string; salary: string; summary: string;
  endorsements: string[]; certifications: string[]; portfolio: string[]; email: string; phone: string;
  history: { company: string; role: string; years: string }[];
};
export type Scan = { candidateId: string; scannedAt: string };
export type ScreeningInsight = { score: number; label: string; coverage: number; evidence: string[]; limitations: string[]; followUp: string; modelVersion: string; source: "mock" | "azure" };
export type AiSummary = { summary: string; strengths: string[]; evidence: string[]; limitations: string[]; modelVersion: string; source: "mock" | "azure" };
export type ScreeningResult = { insight: ScreeningInsight; summary: AiSummary; fetchedAt: string };
export type AppState = { tokens: number; scans: Scan[]; shortlisted: string[]; notes: Record<string, string>; recentlyViewed: string[]; screeningTokens: number; previewsUsed: number; screeningConsents: Record<string, ConsentState>; screeningResults: Record<string, ScreeningResult>; cvProfile: CvProfile | null };
export type UserRole = "candidate" | "recruiter";
export type DemoUser = { name: string; email: string; role: UserRole };

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
  sourceFileName?: string;
  updatedAt: string;
};

export type ConsentState = "not-requested" | "pending-candidate-consent" | "consented" | "declined" | "consent-expired" | "withdrawn" | "screening-in-progress" | "screening-completed" | "disputed";
