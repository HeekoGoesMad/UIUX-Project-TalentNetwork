import type { CvProfile } from "@/types";

export interface SafeCandidateProfileJson {
  identitasProfesional: {
    namaLengkap: string;
    targetPeran: string;
    headline: string;
    domisiliKota: string;
    statusKarier: string;
    preferensiKerja: string;
  };
  ringkasanTentangSaya: string;
  kepribadianKerja?: {
    tipe: string;
    label: string;
    tagline?: string;
  } | null;
  riwayatPengalamanKerja: Array<{
    posisi: string;
    perusahaan: string;
    periode: string;
    tipePekerjaan?: string;
    deskripsiPekerjaan: string;
    pencapaianTerukur: string[];
  }>;
  riwayatPendidikan: Array<{
    jenjang: string;
    institusi: string;
    programStudi: string;
    ipk?: string;
    periode: string;
  }>;
  keahlianDanKompetensi: {
    keahlianTeknis: string[];
    peralatanDanTools: string[];
    softSkills: string[];
    bidangIndustri: string[];
  };
  sertifikasi: string[];
  portofolio: string[];
  catatanPrivasi: string;
}

/**
 * Ekstraksi profil kandidat ke format JSON terstruktur untuk AI Review CV & Profile.
 * KEAMANAN PRIVASI: Seluruh data kontak pribadi (Email, Nomor Telepon, Ekspektasi Gaji, ID Sistem)
 * secara ketat DIHILANGKAN agar privasi kandidat 100% terlindungi.
 */
export function extractSafeCandidateProfileJson(
  profile: Partial<CvProfile> | null | undefined,
  targetRoleOverride?: string
): SafeCandidateProfileJson {
  const p = profile || {};

  // Ekstrak nama kota / wilayah umum tanpa alamat jalan / data pribadi
  const sanitizeLocation = (rawLocation?: string): string => {
    if (!rawLocation) return "Indonesia";
    // Ambil kota/provinsi saja, hindari detail jalan jika ada
    const parts = rawLocation.split(",").map((s) => s.trim());
    return parts.slice(0, 2).join(", ") || "Indonesia";
  };

  const safeExperiences = (Array.isArray(p.experience) ? p.experience : []).map((exp) => ({
    posisi: exp.role || "Posisi Profesional",
    perusahaan: exp.company || "Perusahaan",
    periode: exp.dates || (exp.startDate && exp.endDate ? `${exp.startDate} — ${exp.endDate}` : "Tahun aktif"),
    tipePekerjaan: typeof exp.employmentType === "string" ? exp.employmentType : undefined,
    deskripsiPekerjaan: exp.description || "",
    pencapaianTerukur: Array.isArray(exp.achievements)
      ? exp.achievements.filter(Boolean)
      : typeof exp.achievements === "string" && exp.achievements
      ? [exp.achievements]
      : [],
  }));

  const safeEducation = (Array.isArray(p.education) ? p.education : []).map((edu) => ({
    jenjang: edu.level || "Pendidikan Tinggi",
    institusi: edu.school || "Institusi Pendidikan",
    programStudi: edu.program || "Program Studi",
    ipk: edu.gpa || undefined,
    periode: edu.dates || (edu.startDate && edu.endDate ? `${edu.startDate} — ${edu.endDate}` : "Tahun kelulusan"),
  }));

  const technicalSkills = Array.from(
    new Set([
      ...(Array.isArray(p.hardCompetencies) ? p.hardCompetencies : []),
      ...(Array.isArray(p.skills) ? p.skills : []),
    ])
  ).filter(Boolean);

  const tools = Array.isArray(p.tools) ? p.tools.filter(Boolean) : [];
  const softSkills = Array.isArray(p.softSkills) ? p.softSkills.filter(Boolean) : [];
  const industries = Array.isArray(p.industries) ? p.industries.filter(Boolean) : [];

  return {
    identitasProfesional: {
      namaLengkap: p.fullName?.trim() || "Kandidat Profesional",
      targetPeran: targetRoleOverride?.trim() || p.targetRole?.trim() || p.headline?.trim() || "Profesional",
      headline: p.headline?.trim() || "Profesional Berbakat",
      domisiliKota: sanitizeLocation(p.location),
      statusKarier: p.careerStatus || "open-to-work",
      preferensiKerja: p.workArrangement || "hybrid",
    },
    ringkasanTentangSaya: p.about?.trim() || "",
    kepribadianKerja: p.personality?.type
      ? {
          tipe: p.personality.type,
          label: p.personality.label,
          tagline: p.personality.tagline,
        }
      : null,
    riwayatPengalamanKerja: safeExperiences,
    riwayatPendidikan: safeEducation,
    keahlianDanKompetensi: {
      keahlianTeknis: technicalSkills,
      peralatanDanTools: tools,
      softSkills: softSkills,
      bidangIndustri: industries,
    },
    sertifikasi: Array.isArray(p.certifications) ? p.certifications.filter(Boolean) : [],
    portofolio: Array.isArray(p.portfolio) ? p.portfolio.filter(Boolean) : [],
    catatanPrivasi: "Semua kontak pribadi (email, nomor telepon, ekspektasi gaji) telah dianonimkan demi keamanan privasi kandidat.",
  };
}
