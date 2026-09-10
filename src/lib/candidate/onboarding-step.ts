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
}

/**
 * Returns the 0-indexed step number that the candidate should resume:
 * - Step 2: Tentang kamu (nama, email, phone, headline, about)
 * - Step 3: Lokasi & Peran (location, targetRole)
 * - Step 4: Pengalaman (minimal 1 riwayat perusahaan/peran)
 * - Step 5: Pendidikan (minimal 1 institusi & jurusan)
 * - Step 6: Kompetensi & Skills (minimal 3 skill utama)
 * - Step 8: Review & Publikasikan
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
