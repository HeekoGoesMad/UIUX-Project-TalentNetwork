export interface CandidateStepData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  headline?: string | null;
  about?: string | null;
  location?: string | null;
  targetRole?: string | null;
  experience?: Array<{ company?: string; role?: string }> | null;
  education?: Array<{ school?: string; program?: string }> | null;
  skills?: string[] | null;
  tools?: string[] | null;
  portfolio?: string[] | null;
}

export interface ProfileCompletionSection {
  id: string;
  label: string;
  done: boolean;
  anchor: string;
  hint: string;
}

export interface CandidateReadiness {
  percent: number;
  complete: boolean;
  tier: "Belum Siap" | "Berkembang" | "Siap Dilamar" | "Profil Prima";
  tierColor: string;
  sections: ProfileCompletionSection[];
  missingSections: ProfileCompletionSection[];
  firstIncompleteAnchor: string;
}

/**
 * Single source of truth for candidate profile completeness and ATS readiness.
 */
export function calculateCandidateReadiness(data?: CandidateStepData | null): CandidateReadiness {
  const sections: ProfileCompletionSection[] = [
    {
      id: "basic",
      label: "Data dasar & kontak",
      done: Boolean(data?.fullName?.trim() && data?.email?.trim() && data?.phone?.trim()),
      anchor: "/candidate/cv#basic-info",
      hint: "Nama, email & kontak aktif",
    },
    {
      id: "headline",
      label: "Headline & ringkasan",
      done: Boolean(data?.headline?.trim() && data?.about?.trim()),
      anchor: "/candidate/cv#about",
      hint: "Target peran & ringkasan profesional",
    },
    {
      id: "role",
      label: "Domisili & peran",
      done: Boolean(data?.location?.trim() && data?.targetRole?.trim()),
      anchor: "/candidate/cv#target-role",
      hint: "Lokasi kerja & ekspektasi peran",
    },
    {
      id: "skills",
      label: "Kompetensi & tools",
      done: Boolean(data?.skills && data.skills.length >= 3 && data?.tools && data.tools.length >= 1),
      anchor: "/candidate/cv#competencies",
      hint: "Minimal 3 skill utama & 1 tool",
    },
    {
      id: "experience",
      label: "Pengalaman kerja",
      done: Boolean(data?.experience && data.experience.length > 0),
      anchor: "/candidate/cv#experience",
      hint: "Riwayat pekerjaan & pencapaian",
    },
    {
      id: "education",
      label: "Riwayat pendidikan",
      done: Boolean(data?.education && data.education.length > 0),
      anchor: "/candidate/cv#education",
      hint: "Institusi pendidikan & jurusan",
    },
  ];

  const doneCount = sections.filter((s) => s.done).length;
  const percent = Math.round((doneCount / sections.length) * 100);
  const complete = percent === 100;
  const missingSections = sections.filter((s) => !s.done);
  const firstIncompleteAnchor = missingSections.length > 0 ? missingSections[0].anchor : "/candidate/cv";

  let tier: CandidateReadiness["tier"] = "Belum Siap";
  let tierColor = "text-muted-foreground";

  if (percent === 100) {
    tier = "Profil Prima";
    tierColor = "text-emerald-600";
  } else if (percent >= 80) {
    tier = "Siap Dilamar";
    tierColor = "text-emerald-600";
  } else if (percent >= 50) {
    tier = "Berkembang";
    tierColor = "text-primary";
  } else {
    tier = "Belum Siap";
    tierColor = "text-amber-600";
  }

  return {
    percent,
    complete,
    tier,
    tierColor,
    sections,
    missingSections,
    firstIncompleteAnchor,
  };
}

/**
 * Backward compatibility alias for legacy imports
 */
export function getProfileCompletionSections(data?: CandidateStepData | null): ProfileCompletionSection[] {
  return calculateCandidateReadiness(data).sections;
}

/**
 * Returns the 0-indexed step number that the candidate should resume in the initial onboarding wizard:
 */
export function getFirstIncompleteStep(data?: CandidateStepData | null): number {
  if (!data) return 0;

  if (
    !data.fullName?.trim() ||
    !data.email?.trim() ||
    !data.phone?.trim() ||
    !data.headline?.trim() ||
    !data.about?.trim()
  ) {
    return 2;
  }
  if (!data.location?.trim() || !data.targetRole?.trim()) {
    return 3;
  }
  if (!data.experience?.some((item) => Boolean(item.company?.trim() || item.role?.trim()))) {
    return 4;
  }
  if (!data.education?.some((item) => Boolean(item.school?.trim() && item.program?.trim()))) {
    return 5;
  }
  if (!data.skills || data.skills.length < 3) {
    return 6;
  }
  return 8;
}
