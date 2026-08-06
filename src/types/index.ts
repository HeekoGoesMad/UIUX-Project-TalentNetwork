export type Candidate = {
  id: string; name: string; initials: string; role: string; location: string; experience: number;
  availability: string; skills: string[]; education: string; salary: string; summary: string;
  endorsements: string[]; certifications: string[]; portfolio: string[]; email: string; phone: string;
  history: { company: string; role: string; years: string }[];
};
export type Scan = { candidateId: string; scannedAt: string };
export type AppState = { tokens: number; scans: Scan[]; shortlisted: string[]; notes: Record<string, string>; recentlyViewed: string[] };
