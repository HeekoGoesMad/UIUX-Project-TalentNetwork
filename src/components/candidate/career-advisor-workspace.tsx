"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkSkillsQuality } from "@/lib/ai/skills-check";
import { extractSafeCandidateProfileJson } from "@/lib/cv/candidate-profile-json";
import { cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import {
    AlertTriangle,
    Award,
    Bot,
    Briefcase,
    Check,
    CheckCircle2,
    Clock,
    Compass,
    Copy,
    Download,
    FileText,
    Lock,
    Quote,
    RotateCcw,
    Sparkles,
    Target,
    TrendingUp,
    UserCheck,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { checkCareerAdvisorCooldown, getCareerHubCooldownDays } from "@/lib/career-advisor/cooldown";
import type { CareerAdvisorSavedResult, CvProfile } from "@/types";

export type FocusType = "cv_review" | "gap_analysis" | "career_consultation" | "career_roadmap" | "ats" | "headline" | "star";

interface SectionAudit {
  section: string;
  status: "good" | "needs_improvement";
  notes: string[];
  recommendation: string;
}

interface FormatCheck {
  check: string;
  passed: boolean;
  tip: string;
}

interface ImprovementArea {
  aspect: string;
  impact: string;
  recommendation: string;
}

interface CvReviewDetails {
  readinessLevel: string;
  overallScore: number;
  executiveSummary: string;
  profileSummary?: string;
  keyStrengths?: string[];
  areasForImprovement?: ImprovementArea[];
  recruiterPerspective?: string;
  priorityRecommendations?: string[];
  sectionAudits: SectionAudit[];
  formatChecks: FormatCheck[];
  priorityActionItems: string[];
}

interface CoreCompetency {
  competency: string;
  candidateLevel: string;
  requiredLevel: string;
  status: "match" | "gap" | "exceeds";
  recommendation?: string;
}

interface GapAnalysisDetails {
  targetRole: string;
  matchScore: number;
  matchLevel: string;
  coreCompetencies: CoreCompetency[];
  criticalGaps: string[];
  transferableStrengths: string[];
  strategicRecommendations: string[];
}

interface CareerPhase {
  phaseNumber: number;
  phaseName: string;
  timeframe: string;
  outcome: string;
  keyActions: string[];
  milestone: string;
}

interface ConsultationRecommendation {
  focusArea: string;
  title: string;
  description: string;
  actionableTip: string;
}

interface ConsultationNextStep {
  stepNumber: number;
  title: string;
  timeline: string;
  action: string;
  expectedOutcome: string;
}

interface ConsultationAnalysis {
  overallAssessment: string;
  profileReadiness: string;
  missingDataNotices?: string[];
  cvReviewHighlights?: string;
  gapAnalysisHighlights?: string;
}

interface CareerConsultationDetails {
  targetRole: string;
  targetTimeline: string;
  targetLevel: string;
  analysis?: ConsultationAnalysis;
  recommendations?: ConsultationRecommendation[];
  actionSteps?: ConsultationNextStep[];
  phases?: CareerPhase[];
  recommendedCertifications?: string[];
  strategicAdvice?: string[];
  interviewPitchTips?: string[];
}

interface StructuredAdvice {
  opening: string;
  whatGood: string[];
  whatNotGood: string[];
  conclusion: string;
}

interface AdvisorResult {
  focus: FocusType;
  summary: string;
  structuredAdvice?: StructuredAdvice;
  cvReviewDetails?: CvReviewDetails;
  gapAnalysisDetails?: GapAnalysisDetails;
  careerConsultationDetails?: CareerConsultationDetails;
  careerRoadmapDetails?: CareerConsultationDetails;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure" | "local";
}

const focusPresets: { id: FocusType; label: string; icon: typeof FileText; desc: string; badge: string }[] = [
  {
    id: "cv_review",
    label: "AI CV & Profile Review",
    icon: FileText,
    desc: "Evaluasi profil profesional Anda untuk menemukan area yang dapat ditingkatkan agar lebih menarik bagi recruiter dan sistem ATS.",
    badge: "Pilar 1 (Fokus Utama)",
  },
  {
    id: "gap_analysis",
    label: "AI Career Gap Analysis",
    icon: Target,
    desc: "Analisis kesenjangan kompetensi antara profil Anda saat ini dengan posisi impian yang ingin dicapai.",
    badge: "Pilar 2",
  },
  {
    id: "career_consultation",
    label: "AI Career Consultation",
    icon: Compass,
    desc: "Diskusikan profil, tujuan karier, hasil analisis, dan rencana pengembangan Anda dengan AI yang memahami data profesional Anda.",
    badge: "Pilar 3",
  },
];

export function CareerAdvisorWorkspace({ initialFocus = "cv_review" }: { initialFocus?: FocusType } = {}) {
  const { cvProfile, saveCvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>(initialFocus);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [freshResult, setFreshResult] = useState<AdvisorResult | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const about = cvProfile?.about || "Product designer yang fokus pada user research dan perancangan antarmuka digital.";
  const defaultTargetRole = cvProfile?.targetRole || "Product Designer";
  const skills = useMemo(() => cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma", "User Journey Mapping"], [cvProfile?.skills]);

  const [appliedToCv, setAppliedToCv] = useState(false);
  const [consultationTopic, setConsultationTopic] = useState<string>(
    () => cvProfile?.careerAdvisorResults?.career_consultation?.topic || "Semua Fokus"
  );
  const [consultationQuestion, setConsultationQuestion] = useState<string>(
    () => cvProfile?.careerAdvisorResults?.career_consultation?.question || ""
  );

  const hasCvReview = Boolean(cvProfile?.careerAdvisorResults?.cv_review?.result);
  const hasGapAnalysis = Boolean(cvProfile?.careerAdvisorResults?.gap_analysis?.result);

  // Sync initialFocus when prop changes
  const [prevInitialFocus, setPrevInitialFocus] = useState(initialFocus);
  if (initialFocus !== prevInitialFocus) {
    setPrevInitialFocus(initialFocus);
    setSelectedFocus(initialFocus);
  }

  const activeTargetRole = defaultTargetRole;

  const savedRecord = cvProfile?.careerAdvisorResults?.[selectedFocus];
  const hasSavedResult = Boolean(savedRecord?.result);
  // Hasil evaluasi aktif: utamakan hasil baru yang sedang dianalisis, jika tidak ada fallback ke hasil tersimpan di profil
  const result: AdvisorResult | null = freshResult ?? (savedRecord?.result as AdvisorResult | null) ?? null;

  const cooldown = useMemo(() => checkCareerAdvisorCooldown(savedRecord?.generatedAt), [savedRecord?.generatedAt]);
  const isCooldownActive = cooldown.isCooldown;
  const cooldownDays = useMemo(() => getCareerHubCooldownDays(), []);

  const lastAnalyzedDate = savedRecord?.generatedAt
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(savedRecord.generatedAt))
    : null;

  const isProfileUpdatedAfterAnalysis = Boolean(
    savedRecord?.generatedAt &&
    cvProfile?.updatedAt &&
    new Date(cvProfile.updatedAt).getTime() > new Date(savedRecord.generatedAt).getTime()
  );

  const skillCheck = useMemo(() => checkSkillsQuality(skills, activeTargetRole), [skills, activeTargetRole]);

  // Ekstraksi data profil lengkap tanpa informasi kontak pribadi (Email, Telepon, Gaji)
  const safeProfileJson = useMemo(
    () => extractSafeCandidateProfileJson(cvProfile, activeTargetRole),
    [cvProfile, activeTargetRole]
  );

  const handleApplyToCv = () => {
    if (!cvProfile) {
      toast.error("Profil CV belum tersedia untuk disinkronkan.");
      return;
    }

    // Collect new recommended skills or actions
    const newSkills = new Set(cvProfile.skills || []);
    if (result?.gapAnalysisDetails?.coreCompetencies) {
      result.gapAnalysisDetails.coreCompetencies.forEach((c) => {
        if (c.status === "match" || c.status === "exceeds") {
          newSkills.add(c.competency);
        }
      });
    }

    const updatedProfile = {
      ...cvProfile,
      skills: Array.from(newSkills),
      updatedAt: new Date().toISOString(),
    };

    saveCvProfile(updatedProfile);
    setAppliedToCv(true);
    toast.success("Rekomendasi AI berhasil diterapkan ke draf CV Anda!", {
      description: "Buka halaman CV & Profil untuk meninjau pratinjau ATS terbaru.",
    });
  };

  function handleFocusChange(newFocus: FocusType) {
    setSelectedFocus(newFocus);
    setFreshResult(null);
    if (newFocus === "career_consultation") {
      const rec = cvProfile?.careerAdvisorResults?.career_consultation;
      if (rec?.topic) setConsultationTopic(rec.topic);
      if (rec?.question) setConsultationQuestion(rec.question);
    }
  }

  useEffect(() => {
    if (isStreaming && result) {
      const interval = setInterval(() => {
        setStreamProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsStreaming(false);
            return 100;
          }
          return prev + 5;
        });
      }, 35);

      return () => clearInterval(interval);
    }
  }, [isStreaming, result]);

  async function runAdvisor(options?: { devForce?: boolean }) {
    setLoading(true);
    setIsStreaming(false);
    try {
      const response = await fetch("/api/ai/career-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: selectedFocus,
          headline,
          about,
          targetRole: activeTargetRole,
          skills,
          location: cvProfile?.location || "Jakarta",
          profileJson: safeProfileJson,
          cvReviewResult: cvProfile?.careerAdvisorResults?.cv_review?.result,
          gapAnalysisResult: cvProfile?.careerAdvisorResults?.gap_analysis?.result,
          consultationTopic: selectedFocus === "career_consultation" && consultationTopic !== "Semua Fokus" ? consultationTopic : undefined,
          consultationQuestion: selectedFocus === "career_consultation" && consultationQuestion.trim() ? consultationQuestion.trim() : undefined,
          devForce: options?.devForce,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Gagal mengambil rekomendasi karier.");
      }

      setStreamProgress(0);
      setFreshResult(data as AdvisorResult);
      setIsStreaming(true);

      // Simpan output ke cvProfile agar persisten di AppProvider dan localStorage
      const savedItem: CareerAdvisorSavedResult = (data._savedRecord as CareerAdvisorSavedResult | undefined) || {
        result: data,
        generatedAt: new Date().toISOString(),
        targetRole: activeTargetRole,
        analysisCount: (cvProfile?.careerAdvisorResults?.[selectedFocus]?.analysisCount || 0) + 1,
        ...(selectedFocus === "career_consultation" && consultationTopic !== "Semua Fokus" ? { topic: consultationTopic } : {}),
        ...(selectedFocus === "career_consultation" && consultationQuestion.trim() ? { question: consultationQuestion.trim() } : {}),
      };

      const updatedAdvisorResults = {
        ...(cvProfile?.careerAdvisorResults || {}),
        [selectedFocus]: savedItem,
      };

      const baseProfile: CvProfile = cvProfile || {
        id: "candidate-draft",
        fullName: "Kandidat",
        headline,
        about,
        location: "Jakarta",
        email: "",
        phone: "",
        skills,
        tools: [],
        industries: [],
        experience: [],
        education: [],
        certifications: [],
        portfolio: [],
        targetRole: activeTargetRole,
        workArrangement: "hybrid",
        openToWork: true,
        careerStatus: "open-to-work",
        updatedAt: new Date().toISOString(),
      };

      saveCvProfile({
        ...baseProfile,
        careerAdvisorResults: updatedAdvisorResults,
      });

      toast.success(
        hasSavedResult
          ? "Hasil evaluasi berhasil diperbarui!"
          : "Analisis rekomendasi karier berhasil dihasilkan dan disimpan!"
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDevResetCooldown() {
    if (!cvProfile?.careerAdvisorResults?.[selectedFocus]) return;
    const updatedAdvisorResults = { ...cvProfile.careerAdvisorResults };
    delete updatedAdvisorResults[selectedFocus];
    saveCvProfile({
      ...cvProfile,
      careerAdvisorResults: updatedAdvisorResults,
    });
    setFreshResult(null);
    toast.info("Cooldown untuk pilar ini direset (khusus mode development).");
  }

  function handleDownloadPdf() {
    window.print();
  }

  function handleCopyAdvice() {
    if (!result) return;
    if (selectedFocus === "career_consultation" && consultationData.analysis) {
      const textToCopy = `ProofyLink AI Career Consultation - ${activeTargetRole}\n\n### Analisis\n${consultationData.analysis.overallAssessment}\n\nStatus Kesiapan: ${consultationData.analysis.profileReadiness}\n\n### Rekomendasi\n${(consultationData.recommendations || []).map((r) => `[${r.focusArea}] ${r.title}\n${r.description}\nAksi Praktis: ${r.actionableTip}`).join("\n\n")}\n\n### Langkah Selanjutnya\n${(consultationData.actionSteps || []).map((s) => `${s.stepNumber}. ${s.title} (${s.timeline})\nAksi: ${s.action}\nHasil: ${s.expectedOutcome}`).join("\n\n")}`;
      navigator.clipboard.writeText(textToCopy);
      toast.success("Rangkuman konsultasi karier berhasil disalin ke clipboard!");
      return;
    }
    const focusLabel = focusPresets.find((p) => p.id === selectedFocus)?.label || selectedFocus.replaceAll("_", " ");
    const textToCopy = `ProofyLink Career Advisor - ${focusLabel}\nTarget peran: ${activeTargetRole}\n\nRingkasan:\n${result.summary}\n\nSaran utama:\n- Hal baik: ${adviceData.whatGood.join("; ")}\n- Perlu penguatan: ${adviceData.whatNotGood.join("; ")}\n\nLangkah selanjutnya:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Rangkuman rekomendasi AI berhasil disalin ke clipboard!");
  }

  // Fallback data for CV Review
  const cvReviewData: CvReviewDetails = result?.cvReviewDetails || {
    readinessLevel: skillCheck.isPlausible
      ? (skills.length >= 6 ? "Sangat siap dan mudah dipindai" : "Cukup siap (perlu pengayaan)")
      : "Perlu penyesuaian keahlian",
    overallScore: skillCheck.isPlausible
      ? Math.min(95, 72 + skills.length * 4)
      : 48,
    executiveSummary: skillCheck.isPlausible
      ? `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Struktur informasi dan riwayat pengalaman kerja sudah rapi serta mudah dibaca oleh perekrut. Rekomendasi utama adalah melengkapi bukti hasil kerja nyata dan memperjelas keahlian unggulan Anda.`
      : `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Susunan dasar CV sudah rapi, namun keahlian yang tercantum saat ini (${skills.join(", ") || "belum lengkap"}) belum sesuai dengan kebutuhan posisi ${activeTargetRole}. Prioritaskan perbaikan kompetensi agar sesuai dengan standar industri.`,
    profileSummary: skillCheck.isPlausible
      ? `Profil profesional Anda menunjukkan fondasi yang solid dalam bidang ${activeTargetRole} dengan rekam jejak yang menjanjikan. Secara keseluruhan, informasi tersusun terstruktur dan mudah dipindai oleh recruiter maupun sistem ATS.`
      : `Profil Anda memiliki struktur informasi yang rapi, namun kompetensi teknis yang tercantum (${skills.join(", ") || "belum lengkap"}) belum selaras dengan standar peran target ${activeTargetRole}.`,
    keyStrengths: skillCheck.isPlausible
      ? [
          `Relevansi keahlian: Menguasai ${skills.length} kompetensi yang dibutuhkan pasar kerja untuk peran ${activeTargetRole}.`,
          "Struktur kronologis pengalaman kerja jelas, runut, dan mudah dipahami.",
          "Identitas profesional dan headline peran target terdefinisi dengan baik.",
          "Keterbacaan profil bersih dan profesional bagi rekruter dalam scanning awal.",
        ]
      : [
          "Format teks dan tata letak riwayat pendidikan tersusun rapi.",
          "Headline profesional sudah menyebutkan aspirasi peran yang jelas.",
          "Tautan portofolio dan informasi kontak aktif.",
        ],
    areasForImprovement: skillCheck.isPlausible
      ? [
          {
            aspect: "Kuantifikasi Pencapaian pada Pengalaman Kerja",
            impact: "Recruiter sulit mengukur skala dampak nyata dan efisiensi kontribusi Anda jika hanya membaca deskripsi tugas harian biasa.",
            recommendation: "Gunakan formula STAR/XYZ (misal: 'Meningkatkan efisiensi proses hingga 25% dengan mengotomatisasi...') pada minimal 2 pencapaian utama Anda.",
          },
          {
            aspect: "Pengelompokan Keahlian dan Alat Kerja (Tools)",
            impact: "Keahlian yang bercampur tanpa kategori memperlambat recruiter menemukan tool spesifik dalam scanning 6 detik pertama.",
            recommendation: "Kelompokkan keahlian ke dalam 3 kategori jelas: Core Skills, Tools/Teknologi, dan Metodologi Kerja.",
          },
          {
            aspect: "Ringkasan Eksekutif Profil (Summary)",
            impact: "Tanpa ringkasan nilai jual yang tajam, recruiter belum langsung melihat proposisi nilai unik Anda saat pertama membuka profil.",
            recommendation: "Tulis 3 kalimat padat: Spesialisasi peran, pencapaian kunci terbesar, dan kontribusi spesifik yang siap Anda berikan.",
          },
        ]
      : [
          {
            aspect: "Relevansi Kompetensi Inti dengan Peran Target",
            impact: "Recruiter akan langsung mendiskualifikasi profil pada tahap screening awal karena kompetensi kunci peran target tidak ditemukan.",
            recommendation: `Segera tambahkan dan pelajari kompetensi inti untuk peran ${activeTargetRole}, seperti: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
          },
          {
            aspect: "Bukti Portofolio dan Proyek Nyata",
            impact: "Peluang panggilan interview berkurang drastis tanpa adanya bukti kerja konkret yang relevan dengan posisi yang dilamar.",
            recommendation: "Buat minimal 1 proyek studi kasus mendalam yang mencerminkan pemecahan masalah di posisi target.",
          },
        ],
    recruiterPerspective: skillCheck.isPlausible
      ? `Sebagai recruiter, profil Anda sudah masuk kategori menarik untuk dipertimbangkan ke tahap screening awal (skor ${Math.min(95, 72 + skills.length * 4)}/100). Yang akan membuat Anda menonjol di antara 50+ pelamar lainnya adalah metrik hasil kerja yang terukur dan penjelasan jelas mengenai dampak nyata dari proyek yang pernah Anda tangani.`
      : `Dari sudut pandang recruiter, profil Anda saat ini masih berada di tahap eksplorasi awal untuk peran ${activeTargetRole}. Sebelum melamar ke posisi kompetitif, lengkapi keahlian esensial industri agar tidak tersaring keluar pada tahap screening awal.`,
    priorityRecommendations: skillCheck.isPlausible
      ? [
          "Tambahkan angka/metrik hasil nyata (misal: %, efisiensi, volume) pada 2 pengalaman kerja teratas Anda.",
          "Perjelas ringkasan profil dengan spesialisasi industri dan value proposition Anda.",
          "Kategorikan daftar keahlian agar recruiter dapat memverifikasi kecocokan teknis dalam hitungan detik.",
        ]
      : [
          `Perbarui daftar keahlian di profil agar memuat kompetensi kunci: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
          "Sertakan proyek atau studi kasus nyata yang membuktikan penerapan keahlian target peran.",
          "Sesuaikan headline dan ringkasan profesional agar selaras dengan posisi yang diincar.",
        ],
    sectionAudits: [
      {
        section: "1. Headline dan identitas profesional",
        status: "good",
        notes: [
          `Menyebutkan istilah peran target (${activeTargetRole}) secara jelas dan profesional.`,
          "Format teks bersih, rapi, dan mudah dibaca oleh sistem seleksi maupun tim perekrut."
        ],
        recommendation: "Tambahkan bidang industri yang kamu minati (misal: teknologi, keuangan, atau retail) agar profilmu semakin mudah ditemukan perekrut.",
      },
      {
        section: "2. Ringkasan profil (tentang saya)",
        status: "needs_improvement",
        notes: [
          "Belum merangkum total tahun pengalaman kerja secara ringkas.",
          "Kalimat pembuka masih bisa diperkuat dengan nilai tambah atau pencapaian terbaikmu."
        ],
        recommendation: "Gunakan pola 3-bagian: Peran utama, Keahlian andalan, dan Bukti hasil kerja nyata yang pernah dicapai.",
      },
      {
        section: "3. Riwayat pengalaman kerja",
        status: "needs_improvement",
        notes: [
          "Sebagian poin deskripsi masih berupa uraian tugas harian biasa.",
          "Belum konsisten menyertakan bukti hasil kerja nyata (misal: persentase keberhasilan, jumlah proyek, efisiensi waktu)."
        ],
        recommendation: "Gunakan kata kerja aktif yang jelas di awal setiap poin (misal: Mengembangkan, Memimpin, Merancang) dan sertakan contoh hasil nyata.",
      },
      {
        section: "4. Daftar keahlian dan alat kerja",
        status: skillCheck.isPlausible ? "good" : "needs_improvement",
        notes: skillCheck.isPlausible
          ? [
              `Terdaftar ${skills.length} keahlian yang relevan dengan kebutuhan peran ${activeTargetRole}.`,
              "Kombinasi keahlian teknis dan cara kerja tim sudah terlihat."
            ]
          : [
              `Keahlian yang tercantum (${skills.join(", ") || "belum lengkap"}) belum sesuai dengan standar kompetensi peran ${activeTargetRole}.`,
              "Perekrut membutuhkan keahlian nyata yang sesuai dengan posisi yang dilamar."
            ],
        recommendation: skillCheck.isPlausible
          ? "Kelompokkan keahlian ke dalam Keahlian Teknis, Alat Kerja (Tools), dan Metode Kerja agar mudah dipindai rekruter dalam hitungan detik."
          : `Perbaiki kompetensi agar sesuai dengan peran ${activeTargetRole}, misalnya dengan mempelajari: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
      },
      {
        section: "5. Pendidikan dan bukti portofolio",
        status: "good",
        notes: [
          "Riwayat pendidikan tertera jelas dan tautan proyek dapat diakses dengan baik."
        ],
        recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifikmu dan hasil nyata yang dicapai.",
      },
    ],
    formatChecks: [
      { check: "Kerapian Format & Judul Bagian CV Baku", passed: true, tip: "Gunakan nama bagian standar: Pengalaman Kerja, Pendidikan, Keahlian, Portofolio." },
      { check: "Kesesuaian Kata Kunci & Keahlian Inti", passed: skillCheck.isPlausible, tip: "Gunakan istilah dan kata kunci yang umum dicari rekruter untuk posisi ini." },
      { check: "Keterbacaan Poin Uraian & Tata Letak", passed: true, tip: "Gunakan poin-poin ringkas dan rapi yang nyaman dipindai oleh tim rekruter." },
      { check: "Kelengkapan Tautan Kontak & Portofolio", passed: true, tip: "Tautan profil profesional, portofolio online, dan email kontak telah aktif dan valid." },
    ],
    priorityActionItems: skillCheck.isPlausible
      ? [
          "Tambahkan bukti hasil kerja nyata (angka %, jumlah proyek, efisiensi waktu) pada 2 pengalaman kerja teratas.",
          "Perkaya ringkasan 'Tentang Saya' dengan menyertakan bidang industri yang kamu kuasai (misal: teknologi, keuangan, ritel).",
          "Kelompokkan keahlian teknis dan alat kerja agar mudah dipindai oleh tim perekrut dalam hitungan detik.",
        ]
      : [
          `Perbarui daftar keahlian di CV agar sesuai dengan kompetensi peran ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Tambahkan bukti hasil kerja nyata pada uraian pengalaman kerja agar rekruter lebih yakin.",
          "Tulis ringkasan singkat di bagian 'Tentang Saya' yang menjelaskan keunggulan dan minat karirmu.",
        ],
  };

  // Fallback data for Gap Analysis
  const gapData: GapAnalysisDetails = result?.gapAnalysisDetails || {
    targetRole: activeTargetRole,
    matchScore: skillCheck.isPlausible ? 84 : 40,
    matchLevel: skillCheck.isPlausible ? "Tinggi (selaras baik)" : "Perlu penyesuaian kompetensi",
    coreCompetencies: [
      {
        competency: "Riset Kebutuhan Pengguna & Validasi Solusi",
        candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
        requiredLevel: "Mahir",
        status: skillCheck.isPlausible ? "match" : "gap",
        recommendation: "Pelajari metode riset sederhana dan sertakan contoh proses kerja di portofolio.",
      },
      {
        competency: "Perancangan Komponen & Standar Desain Konsisten",
        candidateLevel: skillCheck.isPlausible ? "Menengah" : "Dasar",
        requiredLevel: "Mahir",
        status: "gap",
        recommendation: "Pelajari cara menyusun komponen desain yang terstruktur dan mudah digunakan tim.",
      },
      {
        competency: "Komunikasi & Kolaborasi Antar-Tim",
        candidateLevel: "Menengah",
        requiredLevel: "Menengah",
        status: "match",
        recommendation: "Keunggulan kerja sama tim yang baik untuk posisi ini.",
      },
      {
        competency: "Analisis Data Pengguna & Uji Coba Peningkatan Solusi",
        candidateLevel: "Dasar",
        requiredLevel: "Menengah",
        status: "gap",
        recommendation: "Sertakan contoh metrik hasil atau efisiensi kerja di portofolio.",
      },
    ],
    criticalGaps: skillCheck.isPlausible
      ? [
          "Pengalaman mengukur dampak nyata setelah proyek selesai perlu lebih dipertegas di CV.",
          "Portofolio studi kasus perlu menyertakan proses perancangan yang terstruktur dari awal hingga akhir.",
          "Perjelas peran kepemimpinan atau inisiatif mandiri saat bekerja bersama tim.",
        ]
      : [
          skillCheck.competencyFeedback,
          "Belum ada bukti proyek portofolio atau studi kasus yang relevan dengan peran target ini.",
          "Perlu membangun pemahaman tentang alat kerja dan metode kerja yang umum digunakan.",
        ],
    transferableStrengths: [
      "Keahlian komunikasi yang baik dan kemudahan berkolaborasi dengan rekan tim.",
      "Kemampuan mengolah data dan masukan menjadi solusi nyata yang bermanfaat.",
    ],
    strategicRecommendations: skillCheck.isPlausible
      ? [
          "Tutup kesenjangan dengan membuat 1 studi kasus mendalam tentang proses kerja di portofolio.",
          "Cantumkan alat kerja (tools) yang Anda kuasai secara jelas di bagian keahlian.",
          "Tuliskan kontribusi Anda bersama tim pada deskripsi pencapaian karir.",
        ]
      : [
          `Perbarui profil dengan mempelajari keahlian dasar untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Buat minimal satu proyek sederhana atau studi kasus untuk membuktikan kemampuan Anda.",
          "Ikuti kursus atau pelatihan daring untuk membangun fondasi keahlian yang dibutuhkan.",
        ],
  };

  // Fallback data for Career Consultation
  const consultationData: CareerConsultationDetails = result?.careerConsultationDetails || result?.careerRoadmapDetails || {
    targetRole: activeTargetRole,
    targetTimeline: "3–6 bulan kesiapan",
    targetLevel: skillCheck.isPlausible ? `Kesiapan kompetitif untuk ${activeTargetRole}` : `Kandidat siap kerja untuk ${activeTargetRole}`,
    analysis: {
      overallAssessment: skillCheck.isPlausible
        ? `Profil profesional Anda memiliki fondasi yang solid untuk posisi ${activeTargetRole}. Pengalaman kerja dan keahlian teknis seperti ${skills.slice(0, 3).join(", ") || "yang terdaftar"} telah menjadi modal awal yang berharga. Fokus utama Anda saat ini adalah menyelaraskan bukti dampak terukur pada portofolio dan mempertajam personal branding agar langsung menarik perhatian hiring manager.`
        : `Profil Anda memiliki susunan identitas dan pendidikan yang baik, namun kompetensi teknis yang tercantum saat ini (${skills.join(", ") || "belum lengkap"}) masih memiliki jarak yang signifikan terhadap kualifikasi standar posisi ${activeTargetRole}. Anda perlu memprioritaskan pembangunan kompetensi dasar dan proyek pembuktian sebelum aktif melamar.`,
      profileReadiness: skillCheck.isPlausible
        ? "Cukup Siap & Kompetitif — Membutuhkan penguatan pembuktian portofolio terukur dan strategi pitching interview."
        : "Tahap Eksplorasi Awal — Memerlukan pembangunan 2-3 keahlian esensial industri dan 1 karya portofolio mandiri.",
      missingDataNotices: skillCheck.isPlausible
        ? [
            "Data metrik pencapaian kuantitatif (%) pada riwayat pengalaman kerja masih dapat diperkaya.",
            "Tautan studi kasus portofolio langsung ke hasil akhir proyek belum sepenuhnya terlampir.",
          ]
        : [
            `Lengkapi keahlian inti peran ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
            "Sertakan minimal 1 tautan portofolio atau proyek nyata sebagai bukti pemecahan masalah.",
          ],
      cvReviewHighlights: skillCheck.isPlausible
        ? "CV terstruktur rapi dan ramah ATS; catatan perbaikan berfokus pada kuantifikasi pencapaian kerja dan kategorisasi tools."
        : `CV membutuhkan penyelarasan kata kunci industri dan pembaruan daftar keahlian target peran ${activeTargetRole}.`,
      gapAnalysisHighlights: skillCheck.isPlausible
        ? "Kompetensi inti mayoritas selaras; kesenjangan terdapat pada penguasaan tooling tingkat lanjut dan kepemimpinan proyek."
        : `Kesenjangan kritis pada penguasaan keahlian spesifik industri seperti ${skillCheck.recommendedSkillsForRole.slice(0, 2).join(", ")}.`,
    },
    recommendations: [
      {
        focusArea: "Pengembangan karier",
        title: `Peta Jalan Transisi Menuju ${activeTargetRole}`,
        description: `Susun rencana karier 6 bulan dengan membagi fase pembelajaran menjadi penguasaan keahlian inti, publikasi portofolio, dan lamaran aktif ke perusahaan target.`,
        actionableTip: `Tentukan 5 perusahaan impian dan catat kesamaan kualifikasi yang mereka butuhkan sebagai panduan belajar mingguan.`,
      },
      {
        focusArea: "Peningkatan kompetensi",
        title: "Penguasaan Keahlian Kunci Berdampak Tinggi",
        description: skillCheck.isPlausible
          ? `Perdalam keahlian analitis dan metodologi kerja industri untuk meningkatkan nilai tawar Anda saat wawancara teknis.`
          : `Prioritaskan mempelajari 3 keahlian utama untuk peran ${activeTargetRole}: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}.`,
        actionableTip: `Alokasikan 5-7 jam per minggu untuk latihan studi kasus nyata menggunakan alat kerja standar industri.`,
      },
      {
        focusArea: "Pengembangan portofolio",
        title: "Studi Kasus Pembuktian (Proof of Work)",
        description: "Recruiter ingin melihat bagaimana Anda memecahkan masalah nyata dari tahap identifikasi hingga metrik dampak akhir.",
        actionableTip: "Pilih 1 proyek terbaik, buat ringkasan 1 halaman dengan struktur: Masalah, Solusi Anda, dan Metrik Hasil Terukur.",
      },
      {
        focusArea: "Penyusunan CV",
        title: "Optimalisasi CV Berbasis Pencapaian (STAR/XYZ)",
        description: "Ubah deskripsi tugas harian yang pasif menjadi narasi pencapaian proaktif dengan angka atau persentase yang jelas.",
        actionableTip: "Tulis ulang minimal 2 poin pekerjaan teratas menggunakan format 'Mencapai [X], diukur dengan [Y], melalui tindakan [Z]'.",
      },
      {
        focusArea: "Persiapan interview",
        title: "Teknik Pitching 2 Menit & Jawaban Perilaku (Behavioral)",
        description: "Latih cara menceritakan latar belakang Anda secara ringkas dan lugas, serta siapkan narasi tantangan kerja yang pernah Anda selesaikan.",
        actionableTip: "Gunakan formula STAR (Situation, Task, Action, Result) untuk menjawab pertanyaan 'Ceritakan proyek tersulit yang pernah Anda tangani'.",
      },
      {
        focusArea: "Strategi mencapai target karier",
        title: "Personal Branding & Visibilitas ke Recruiter",
        description: "Pastikan profil ProofyLink dan jejaring profesional Anda aktif mencerminkan spesialisasi dan ketersediaan kerja.",
        actionableTip: "Publikasikan satu tulisan singkat atau breakdown proyek di media profesional untuk menarik perhatian hiring manager.",
      },
    ],
    actionSteps: [
      {
        stepNumber: 1,
        title: "Audit & Lengkapi Data Profil",
        timeline: "Minggu 1",
        action: "Perbarui bagian keahlian dan lampirkan tautan portofolio proyek terbaru pada halaman CV & Profil.",
        expectedOutcome: "Profil memiliki kelengkapan data di atas 90% dan siap dipindai oleh recruiter.",
      },
      {
        stepNumber: 2,
        title: "Poles Portofolio Studi Kasus Unggulan",
        timeline: "Minggu 2 — 3",
        action: "Susun 1 studi kasus mendalam yang mencakup proses pengambilan keputusan dan dampak terukur.",
        expectedOutcome: "Memiliki bukti kerja nyata yang langsung memvalidasi kompetensi di mata recruiter.",
      },
      {
        stepNumber: 3,
        title: "Simulasi Wawancara & Pitching STAR",
        timeline: "Minggu 4",
        action: "Latih 3 cerita pencapaian utama dengan formula STAR dan siapkan jawaban untuk celah pengalaman.",
        expectedOutcome: "Percaya diri dan lugas saat menyampaikan nilai tambah unik Anda di hadapan hiring manager.",
      },
      {
        stepNumber: 4,
        title: "Penyebaran Lamaran Terarah & Networking",
        timeline: "Bulan 2 — 3",
        action: "Kirimkan lamaran ke posisi yang selaras minimal 70% dan hubungi recruiter atau alumni di industri terkait.",
        expectedOutcome: "Mendapatkan undangan interview pertama dari perusahaan yang sesuai dengan target karier.",
      },
    ],
    phases: [
      {
        phaseNumber: 1,
        phaseName: skillCheck.isPlausible ? "Pembuktian Portofolio & Keunggulan Relevan" : "Penyelarasan & Pembangunan Keahlian Inti",
        timeframe: "Bulan 1 — 2",
        outcome: skillCheck.isPlausible
          ? "Portofolio proyek memiliki bukti hasil kerja nyata yang langsung memikat HRD saat peninjauan pertama."
          : `Keahlian inti untuk posisi ${activeTargetRole} mulai dikuasai dan portofolio awal terbentuk.`,
        keyActions: skillCheck.isPlausible
          ? [
              "Poles 1-2 studi kasus portofolio dengan menekankan peran spesifik dan metrik dampak positif",
              "Perbarui headline dan ringkasan profil agar mencerminkan spesialisasi bidang kerjamu",
              "Kelompokkan keahlian teknis dan alat kerja utama agar mudah dipindai HRD",
            ]
          : [
              `Fokus pelajari 2-3 keahlian utama untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")})`,
              "Perbarui daftar keahlian di CV setelah menguasai materi baru",
              "Buat 1 proyek latihan terstruktur sebagai bukti portofolio awal",
            ],
        milestone: skillCheck.isPlausible
          ? "Profil & Portofolio memiliki daya tarik tinggi saat disaring oleh HRD"
          : `Keahlian di profil selaras dengan kebutuhan peran ${activeTargetRole}`,
      },
      {
        phaseNumber: 2,
        phaseName: "Personal Branding & Visibilitas ke Perekrut",
        timeframe: "Bulan 2 — 4",
        outcome: "Profil aktif terlihat di radar pencarian talent dan mulai menerima undangan peluang kerja.",
        keyActions: [
          "Publikasikan rangkuman pembelajaran proyek atau studi kasus di komunitas profesional atau LinkedIn",
          "Lengkapi seluruh bagian profil ProofyLink untuk memaksimalkan peluang rekomendasi otomatis",
          "Minta umpan balik dari rekan kerja atau mentor mengenai kejelasan portofoliomu",
        ],
        milestone: "Mendapatkan tanggapan positif dan undangan wawancara dari perekrut",
      },
      {
        phaseNumber: 3,
        phaseName: "Strategi Pitching Wawancara & Evaluasi Tawaran",
        timeframe: "Bulan 4 — 6",
        outcome: "Mampu menyampaikan keunggulan diri secara percaya diri dan meraih penawaran kerja terbaik.",
        keyActions: [
          "Siapkan narasi STAR (Situation, Task, Action, Result) untuk setiap pencapaian utama",
          "Latih penjelasan jujur namun positif seputar transisi karir atau celah pengalaman",
          "Pelajari riset standar kompensasi dan nilai tambah unik yang kamu bawa untuk perusahaan",
        ],
        milestone: "Menerima dan menegosiasikan penawaran kerja resmi sesuai target karir",
      },
    ],
    recommendedCertifications: [
      `Pelatihan Praktis & Studi Kasus Bidang ${activeTargetRole}`,
      "Sertifikasi Profesional atau Lisensi Alat Kerja Industri",
      "Lokakarya Komunikasi Efektif & Kolaborasi Tim",
    ],
    strategicAdvice: [
      "Perekrut lebih tertarik pada bagaimana caramu memecahkan masalah nyata dibanding sekadar panjangnya daftar tugas.",
      "Jelaskan kontribusi pribadimu secara jujur dan transparan saat menceritakan proyek kolaborasi.",
      "Gunakan setiap wawancara kerja sebagai ruang bertukar wawasan dua arah, bukan sekadar ujian.",
    ],
    interviewPitchTips: [
      "Gunakan formula STAR: sebutkan tantangan yang dihadapi, aksimu, dan hasil positif yang dicapai.",
      "Jika ada kesenjangan pengalaman atau transisi karir, tonjolkan kecepatan belajar dan transferable skills yang relevan.",
      "Tunjukkan antusiasme dengan mempelajari produk atau tantangan bisnis perusahaan sebelum sesi interview.",
    ],
  };

  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan evaluasi '${selectedFocus.replaceAll("_", " ")}' untuk posisi ${activeTargetRole}, berikut beberapa poin penting:`,
    whatGood: [
      "Format susunan CV rapi, bersih, dan mudah dibaca oleh tim perekrut.",
      skillCheck.isPlausible
        ? `Keahlian yang dicantumkan (${skillCheck.validSkills.slice(0, 3).join(", ")}) sudah relevan dengan target posisi.`
        : "Informasi profil dan kontak utama sudah terisi dengan jelas.",
    ],
    whatNotGood: skillCheck.isPlausible
      ? [
          "Uraian pengalaman kerja masih bisa diperjelas dengan bukti hasil nyata (angka %, jumlah proyek, efisiensi waktu).",
          "Ringkasan profil belum menonjolkan bidang industri utama yang kamu kuasai.",
        ]
      : [
          skillCheck.competencyFeedback,
          "Uraian pengalaman kerja masih kurang bukti hasil nyata yang meyakinkan perekrut.",
        ],
    conclusion: skillCheck.isPlausible
      ? "Terapkan rekomendasi di atas untuk membuat CV kamu semakin menarik dan meningkatkan peluang dipanggil wawancara."
      : `Perbaiki daftar keahlian agar sesuai dengan standar posisi ${activeTargetRole} untuk membuka peluang lebih besar saat melamar pekerjaan.`,
  };

  return (
    <div className="space-y-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report,
          #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Pilih fokus evaluasi</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pilih satu aspek untuk dianalisis dan dapatkan rekomendasi yang bisa langsung diterapkan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {focusPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedFocus === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleFocusChange(preset.id)}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-4 sm:p-5 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                    : "border-border/80 bg-card hover:bg-muted/40 hover:border-border"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    {isSelected ? (
                      <Badge variant="outline" className="border-primary/30 bg-primary/10 text-xs font-semibold text-primary">
                        Aktif
                      </Badge>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">{preset.badge}</span>
                    )}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{preset.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Pilar 3: Interactive Consultation Setup */}
        {selectedFocus === "career_consultation" && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  Konfigurasi AI Career Consultation
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI memahami profil profesional Anda dan mengintegrasikan hasil evaluasi CV serta analisis kesenjangan karier.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] gap-1",
                    hasCvReview
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {hasCvReview ? <Check className="size-3 text-emerald-600" /> : <Clock className="size-3 text-muted-foreground" />}
                  {hasCvReview ? "Pilar 1 Terhubung" : "Pilar 1 Belum Dijalankan"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[11px] gap-1",
                    hasGapAnalysis
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-muted text-muted-foreground"
                  )}
                >
                  {hasGapAnalysis ? <Check className="size-3 text-emerald-600" /> : <Clock className="size-3 text-muted-foreground" />}
                  {hasGapAnalysis ? "Pilar 2 Terhubung" : "Pilar 2 Belum Dijalankan"}
                </Badge>
              </div>
            </div>

            {/* Pilihan 7 Fokus Cepat */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground block">
                Fokus topik konsultasi (Pilih salah satu dari 7 area atau biarkan menyeluruh):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Semua Fokus",
                  "Pengembangan karier",
                  "Peningkatan kompetensi",
                  "Persiapan rekrutmen",
                  "Pengembangan portofolio",
                  "Penyusunan CV",
                  "Persiapan interview",
                  "Strategi mencapai target karier",
                ].map((topic) => {
                  const isTopicSelected = consultationTopic === topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setConsultationTopic(topic)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer border",
                        isTopicSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted/40"
                      )}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Pertanyaan / Goal Spesifik */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground block">
                Pertanyaan khusus atau skenario karier yang ingin didiskusikan (opsional):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={consultationQuestion}
                  onChange={(e) => setConsultationQuestion(e.target.value)}
                  placeholder="Misal: Bagaimana strategi switch career ke Fintech? atau Apa saja persiapan interview teknis yang krusial?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Evaluasi pilar:{" "}
                <span className="text-primary">
                  {focusPresets.find((p) => p.id === selectedFocus)?.label}
                </span>
              </p>
              {savedRecord && (
                <Badge variant="outline" className="border-border text-[11px] font-normal text-muted-foreground gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  Dianalisis: {lastAnalyzedDate}
                  {savedRecord.analysisCount ? ` · Analisis ke-${savedRecord.analysisCount}` : ""}
                </Badge>
              )}
              {isCooldownActive && (
                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-medium gap-1">
                  <Lock className="size-3 text-amber-600" />
                  Cooldown aktif · {cooldown.daysRemaining} hari lagi
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {savedRecord
                ? isCooldownActive
                  ? `Hasil evaluasi pilar ini telah disimpan dan dapat Anda pelajari di bawah. Untuk mengontrol penggunaan kuota token AI, analisis ulang dapat dijalankan kembali 1 kali setiap ${cooldownDays} hari (tersedia pada ${cooldown.nextAvailableFormatted}).`
                  : isProfileUpdatedAfterAnalysis
                  ? "Ada pembaruan data profil sejak analisis ini. Cooldown telah selesai, Anda dapat menjalankan analisis ulang untuk memperbarui rekomendasi."
                  : "Hasil evaluasi tersimpan siap ditinjau kapan saja. Cooldown telah selesai, Anda dapat menjalankan analisis ulang jika diperlukan."
                : `AI akan menganalisis riwayat profil, pengalaman kerja, pendidikan, dan keahlian Anda secara menyeluruh untuk target posisi ${activeTargetRole}.`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => void runAdvisor()}
              disabled={loading || isCooldownActive}
              size="default"
              variant={savedRecord ? "outline" : "default"}
              className={cn(
                "w-full sm:w-auto shrink-0 gap-2 font-semibold px-5 shadow-xs",
                isCooldownActive ? "cursor-not-allowed opacity-75" : "cursor-pointer"
              )}
            >
              {loading ? (
                <>
                  <Bot className="size-4 animate-spin" /> Menganalisis profil...
                </>
              ) : isCooldownActive ? (
                <>
                  <Lock className="size-4 text-amber-600" /> Analisis Ulang ({cooldown.daysRemaining}h lagi)
                </>
              ) : savedRecord ? (
                <>
                  <RotateCcw className="size-4" /> Analisis ulang
                </>
              ) : (
                <>
                  <Sparkles className="size-4" /> Analisis dan hasilkan rekomendasi
                </>
              )}
            </Button>
            {process.env.NODE_ENV !== "production" && isCooldownActive && (
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void runAdvisor({ devForce: true })}
                  disabled={loading}
                  className="text-[11px] h-8 px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-100/50"
                  title="Abaikan cooldown untuk kebutuhan pengujian developer"
                >
                  Force Run (Dev)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDevResetCooldown}
                  className="text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground"
                  title="Hapus data cooldown untuk pilar ini"
                >
                  Reset (Dev)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Empty State when unanalyzed ─── */}
      {!result && !loading && (
        <Card className="border-border/80 bg-card p-8 sm:p-12 text-center rounded-xl shadow-xs animate-fade-up">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            {selectedFocus === "cv_review" && <FileText className="size-7" />}
            {selectedFocus === "gap_analysis" && <Target className="size-7" />}
            {selectedFocus === "career_consultation" && <Compass className="size-7" />}
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {selectedFocus === "cv_review" && "Evaluasi Mendalam CV & Profil Profesional"}
            {selectedFocus === "gap_analysis" && "Analisis Kesenjangan Karier & Kompetensi"}
            {selectedFocus === "career_consultation" && "Sesi Konsultasi & Peta Jalan Karier AI"}
          </h3>
          <p className="mt-2 max-w-lg mx-auto text-sm text-muted-foreground leading-relaxed">
            {selectedFocus === "cv_review" &&
              "Dapatkan audit lengkap struktur CV, kesiapan ATS, identifikasi kekuatan kunci, serta rekomendasi perbaikan spesifik berdasarkan profil profesional Anda."}
            {selectedFocus === "gap_analysis" &&
              `Bandingkan profil Anda saat ini dengan standar industri untuk posisi target ${activeTargetRole}. Temukan skill gap kritis dan rekomendasi aksi peningkatan.`}
            {selectedFocus === "career_consultation" &&
              "Dapatkan rencana aksi pengembangan karier 6 bulan, tips pitching wawancara, dan rekomendasi strategis yang terpersonalisasi untuk perjalanan karier Anda."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => void runAdvisor()}
              size="lg"
              className="gap-2 font-semibold shadow-xs"
            >
              <Sparkles className="size-4" /> Mulai Analisis {focusPresets.find((p) => p.id === selectedFocus)?.label}
            </Button>
          </div>
          <div className="mt-6 border-t pt-4 max-w-md mx-auto flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Hasil analisis akan otomatis tersimpan di halaman ini dan dapat ditinjau kapan saja.</span>
          </div>
        </Card>
      )}

      {/* ─── Advice Results ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-fade-up">
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">ProofyLink — Laporan evaluasi karier dan profil AI</h1>
            <p className="text-sm text-muted-foreground">
              Kandidat: {cvProfile?.fullName || "Profil kamu"} | Peran dituju: {activeTargetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Draf AI</Badge>
              {savedRecord ? (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  Hasil tersimpan · Dianalisis: {lastAnalyzedDate}
                  {savedRecord.analysisCount ? ` (${savedRecord.analysisCount}x analisis)` : ""}
                  {isCooldownActive && (
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] py-0 px-1.5 ml-1">
                      Cooldown {cooldown.daysRemaining}h lagi
                    </Badge>
                  )}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Hasil analisis siap ditinjau.</span>
              )}
              {isStreaming && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Memproses... ({streamProgress}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyAdvice}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Copy className="size-3.5" /> Salin rekomendasi
              </Button>
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
              >
                <Download className="size-3.5" /> Unduh PDF
              </Button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 1: AI CV & PROFILE REVIEW (5 SEKSI RESMI PROMPT) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "cv_review" || result.focus === "ats") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg text-foreground">AI CV & Profile Review</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Evaluasi profil profesional oleh Senior Recruiter & Career Coach (15+ tahun pengalaman)
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium tabular-nums">
                        Skor Kesiapan: <strong className="ml-1 text-foreground">{cvReviewData.overallScore}/100</strong>
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {cvReviewData.readinessLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-7">
                  {/* 1. Ringkasan Profil */}
                  <div className="rounded-lg border bg-card p-5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Ringkasan Profil
                      </h3>
                    </div>
                    <p className="text-sm leading-7 text-foreground">
                      {cvReviewData.profileSummary || cvReviewData.executiveSummary}
                    </p>
                  </div>

                  {/* 2. Kekuatan Utama (3-5 poin) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Award className="size-4 text-emerald-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Kekuatan Utama
                      </h3>
                    </div>
                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {(cvReviewData.keyStrengths && cvReviewData.keyStrengths.length > 0
                        ? cvReviewData.keyStrengths
                        : adviceData.whatGood
                      ).map((strength, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg border bg-card p-3.5 flex items-start gap-2.5 text-sm leading-6 text-foreground shadow-2xs"
                        >
                          <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-1" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 3. Area yang Perlu Ditingkatkan (Aspek + Dampak + Rekomendasi) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Area yang Perlu Ditingkatkan
                      </h3>
                    </div>
                    <div className="space-y-3.5">
                      {(cvReviewData.areasForImprovement && cvReviewData.areasForImprovement.length > 0
                        ? cvReviewData.areasForImprovement
                        : cvReviewData.sectionAudits.map((s) => ({
                            aspect: s.section,
                            impact: s.notes.join("; "),
                            recommendation: s.recommendation,
                          }))
                      ).map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border bg-card p-4 space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <strong className="text-sm font-medium text-foreground">
                              {item.aspect}
                            </strong>
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                              Area #{idx + 1}
                            </Badge>
                          </div>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            <div className="rounded-md border border-amber-200/60 bg-amber-50/40 p-3 text-xs leading-5 dark:border-amber-950 dark:bg-amber-950/20">
                              <span className="font-semibold text-amber-900 dark:text-amber-300 block mb-1">
                                Dampak terhadap peluang kerja:
                              </span>
                              <span className="text-amber-800 dark:text-amber-400">
                                {item.impact}
                              </span>
                            </div>
                            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs leading-5">
                              <span className="font-semibold text-primary block mb-1">
                                Rekomendasi perbaikan langsung:
                              </span>
                              <span className="text-foreground">
                                {item.recommendation}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 4. Perspektif Recruiter */}
                  <div className="rounded-lg border bg-muted/30 p-5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Perspektif Recruiter
                      </h3>
                    </div>
                    <div className="relative pl-6">
                      <Quote className="size-4 text-muted-foreground/50 absolute left-0 top-0" />
                      <p className="text-sm leading-7 text-foreground italic">
                        &ldquo;{cvReviewData.recruiterPerspective || cvReviewData.executiveSummary}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* 5. Rekomendasi Prioritas (3-5 langkah aksi) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="size-4 text-primary shrink-0" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Rekomendasi Prioritas
                      </h3>
                    </div>
                    <ol className="divide-y divide-border rounded-lg border bg-card">
                      {(cvReviewData.priorityRecommendations && cvReviewData.priorityRecommendations.length > 0
                        ? cvReviewData.priorityRecommendations
                        : cvReviewData.priorityActionItems
                      ).map((item, idx) => (
                        <li
                          key={idx}
                          className="p-4 flex items-start gap-3 text-sm leading-6 text-foreground"
                        >
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {idx + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Pemeriksaan Tambahan: Kerapian Format & Keterbacaan */}
                  {cvReviewData.formatChecks && cvReviewData.formatChecks.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pemeriksaan Kerapian Format & Keterbacaan Rekruter
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {cvReviewData.formatChecks.map((check, i) => (
                          <div key={i} className="rounded-lg border bg-card p-3 flex items-start gap-2.5">
                            {check.passed ? (
                              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                            )}
                            <div className="text-sm">
                              <strong className="block text-foreground font-medium text-xs">{check.check}</strong>
                              <span className="text-muted-foreground mt-0.5 block leading-5 text-xs">{check.tip}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 2: GAP ANALYSIS (KESIAPAN KARIR HARI INI) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "gap_analysis" || result.focus === "headline") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Target className="size-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg text-foreground">AI Career Gap Analysis — Evaluasi Kesiapan Peran Impian</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Target posisi impian: <span className="font-medium text-foreground">{gapData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Kecocokan profil:</span>
                      <Badge variant="secondary" className="text-xs font-medium tabular-nums">
                        {gapData.matchScore}% · {gapData.matchLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Core Competencies Matrix */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground">
                      Evaluasi kompetensi inti
                    </h3>
                    <ul className="divide-y divide-border rounded-lg border bg-card">
                      {gapData.coreCompetencies.map((comp, i) => (
                        <li key={i} className="p-4 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <strong className="text-sm font-medium text-foreground">{comp.competency}</strong>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground tabular-nums">
                                Level saat ini: <strong className="text-foreground font-medium">{comp.candidateLevel}</strong> · Target: <strong className="text-foreground font-medium">{comp.requiredLevel}</strong>
                              </span>
                              <Badge
                                variant={comp.status === "gap" ? "outline" : "secondary"}
                                className="text-xs font-medium"
                              >
                                {comp.status === "match" ? "Sesuai" : comp.status === "exceeds" ? "Melebihi" : "Ada kesenjangan"}
                              </Badge>
                            </div>
                          </div>
                          {comp.recommendation && (
                            <p className="text-sm leading-6 text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                              <strong className="text-foreground font-medium">Rekomendasi peningkatan:</strong> {comp.recommendation}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2-Column: Critical Gaps vs Transferable Strengths */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Kesenjangan kritis yang perlu ditutup
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                        {gapData.criticalGaps.map((gap, i) => (
                          <li key={i}>{gap}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border bg-muted/40 p-4 space-y-2.5">
                      <h4 className="text-sm font-medium text-foreground">
                        Keunggulan dan kekuatan transferable
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                        {gapData.transferableStrengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strategic Upskilling Action Items */}
                  <div className="rounded-lg border bg-card p-4 space-y-2.5">
                    <h4 className="text-sm font-medium text-foreground">
                      Rekomendasi aksi peningkatan hari ini
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                      {gapData.strategicRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 3: AI CAREER CONSULTATION (FORMAT 3 SEKSI RESMI) ───── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "career_consultation" || result.focus === "career_roadmap" || result.focus === "star") && (
            <div className="space-y-6">
              {/* Header Ringkasan Konsultasi */}
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4 bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Compass className="size-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg text-foreground">AI Career Consultation</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Target peran: <span className="font-medium text-foreground">{consultationData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs font-medium tabular-nums">
                        Timeline: {consultationData.targetTimeline}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-medium">
                        {consultationData.targetLevel}
                      </Badge>
                    </div>
                  </div>
                  {(savedRecord?.topic || savedRecord?.question) && (
                    <div className="mt-3 rounded-lg border bg-card/60 p-3 space-y-1 text-xs border-primary/15">
                      {savedRecord.topic && (
                        <p className="text-foreground">
                          <span className="text-muted-foreground font-medium">Fokus Topik Konsultasi: </span>
                          <strong className="text-primary font-semibold">{savedRecord.topic}</strong>
                        </p>
                      )}
                      {savedRecord.question && (
                        <p className="text-foreground">
                          <span className="text-muted-foreground font-medium">Pertanyaan yang Dikonsultasikan: </span>
                          <span className="italic text-foreground font-medium">&ldquo;{savedRecord.question}&rdquo;</span>
                        </p>
                      )}
                    </div>
                  )}
                </CardHeader>
              </Card>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 1. ### Analisis                                               */}
              {/* ───────────────────────────────────────────────────────────── */}
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        1
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">Analisis</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Evaluasi profil profesional, status kesiapan, dan integrasi hasil analisis CV & gap kompetensi
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5">
                      Format Resmi: Analisis
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Evaluasi Menyeluruh */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Evaluasi Profil & Kesiapan Menyeluruh</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground bg-muted/30 p-4 rounded-lg border">
                      {consultationData.analysis?.overallAssessment || result.summary}
                    </p>
                  </div>

                  {/* Status Kesiapan */}
                  {consultationData.analysis?.profileReadiness && (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                      <span>
                        <strong className="font-semibold">Tingkat Kesiapan Karier:</strong> {consultationData.analysis.profileReadiness}
                      </span>
                    </div>
                  )}

                  {/* Notice Data yang Perlu Dilengkapi */}
                  {consultationData.analysis?.missingDataNotices && consultationData.analysis.missingDataNotices.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Data Profil yang Perlu Dilengkapi (Untuk Akurasi Maksimal)</span>
                      </div>
                      <p className="text-xs text-amber-800/90 dark:text-amber-300/90">
                        AI mendeteksi beberapa informasi penting yang perlu Anda lengkapi pada profil untuk meningkatkan akurasi rekomendasi:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                        {consultationData.analysis.missingDataNotices.map((notice, idx) => (
                          <li key={idx}>{notice}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 2-Kolom: Konteks Hasil Pilar 1 & Pilar 2 */}
                  <div className="grid gap-4 sm:grid-cols-2 pt-1">
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <FileText className="size-3.5 text-primary" />
                        <span>Konteks AI CV Review (Pilar 1)</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {consultationData.analysis?.cvReviewHighlights || "Data CV terintegrasi untuk menyelaraskan keahlian dan riwayat pengalaman."}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Target className="size-3.5 text-primary" />
                        <span>Konteks AI Career Gap Analysis (Pilar 2)</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {consultationData.analysis?.gapAnalysisHighlights || "Data kesenjangan kompetensi terintegrasi untuk menentukan prioritas peningkatan."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 2. ### Rekomendasi                                            */}
              {/* ───────────────────────────────────────────────────────────── */}
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs">
                        2
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">Rekomendasi</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Rekomendasi strategis berbasis 7 fokus jawaban yang spesifik, praktis, dan berorientasi tindakan
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/5">
                      Format Resmi: Rekomendasi
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Grid 7 Fokus Rekomendasi */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {(consultationData.recommendations || []).map((rec, i) => (
                      <div key={i} className="flex flex-col justify-between rounded-lg border bg-card p-4 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary" className="text-[11px] font-medium">
                              {rec.focusArea}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm text-foreground">{rec.title}</h4>
                          <p className="text-xs leading-relaxed text-muted-foreground">{rec.description}</p>
                        </div>
                        <div className="pt-2.5 border-t border-border/80">
                          <div className="flex items-start gap-2 bg-muted/40 rounded-md p-2.5">
                            <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground font-medium leading-relaxed">
                              <span className="text-muted-foreground font-normal">Aksi Praktis: </span>
                              {rec.actionableTip}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips Wawancara & Saran Recruiter */}
                  <div className="grid gap-4 md:grid-cols-2 pt-2">
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Quote className="size-3.5 text-primary" /> Tips Pitching & Persiapan Wawancara
                      </h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground leading-relaxed">
                        {(consultationData.interviewPitchTips || []).map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <UserCheck className="size-3.5 text-primary" /> Saran Strategis dari Sudut Pandang Recruiter
                      </h5>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground leading-relaxed">
                        {(consultationData.strategicAdvice || []).map((adv, idx) => (
                          <li key={idx}>{adv}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Recommended Certifications / Pelatihan */}
                  {consultationData.recommendedCertifications && consultationData.recommendedCertifications.length > 0 && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                      <h5 className="text-xs font-semibold text-foreground">
                        Sertifikasi & Pelatihan yang Direkomendasikan
                      </h5>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {consultationData.recommendedCertifications.map((cert, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-medium">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* 3. ### Langkah Selanjutnya                                    */}
              {/* ───────────────────────────────────────────────────────────── */}
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600 font-bold text-xs">
                        3
                      </div>
                      <div>
                        <CardTitle className="text-base text-foreground">Langkah Selanjutnya</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Urutan langkah aksi konkret yang berorientasi tindakan beserta linimasa dan target pencapaian
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-medium border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5">
                      Format Resmi: Langkah Selanjutnya
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {(consultationData.actionSteps || []).map((step) => (
                      <div key={step.stepNumber} className="rounded-lg border bg-card p-4 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-primary">
                              Langkah {step.stepNumber}
                            </span>
                            <Badge variant="outline" className="text-[11px] font-medium">
                              {step.timeline}
                            </Badge>
                          </div>
                          <h5 className="text-sm font-semibold text-foreground">{step.title}</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Aksi:</strong> {step.action}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-border/80">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">Target Hasil:</strong> {step.expectedOutcome}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Gunakan langkah terstruktur di atas untuk memandu tindakan nyata dalam membangun karier Anda.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={appliedToCv ? "outline" : "default"}
                        onClick={handleApplyToCv}
                        className="gap-1.5 text-xs font-medium"
                      >
                        <Sparkles className="size-3.5" />
                        {appliedToCv ? "Tersinkron ke CV" : "Terapkan rekomendasi ke CV"}
                      </Button>
                      <Link href="/candidate/cv">
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs font-medium">
                          <FileText className="size-3.5" /> Buka editor CV
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Executive Summary & Action Steps ─── */}
          {result.focus !== "career_consultation" && (
            <Card className="no-print border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                  <Zap className="size-4 text-muted-foreground" /> Rangkuman saran dan langkah selanjutnya
                </CardTitle>
                <Button
                  size="sm"
                  variant={appliedToCv ? "outline" : "default"}
                  onClick={handleApplyToCv}
                  className="shrink-0 gap-1.5 text-xs font-medium"
                >
                  <Sparkles className="size-3.5" />
                  {appliedToCv ? "Tersinkron ke CV" : "Terapkan saran ke CV"}
                </Button>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Hal yang sudah baik
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                      {adviceData.whatGood.map((good, idx) => (
                        <li key={idx}>{good}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Area yang perlu penguatan
                    </h4>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm leading-6 text-foreground">
                      {adviceData.whatNotGood.map((bad, idx) => (
                        <li key={idx}>{bad}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Gunakan rekomendasi evaluasi di atas untuk memperbarui profil dan portofoliomu.
                  </p>
                  <Link href="/candidate/cv">
                    <Button className="gap-2 font-medium rounded-lg shadow-xs">
                      <FileText className="size-4" /> Buka workspace CV dan edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Disclosure Footer */}
          <div className="border-t pt-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge variant="secondary">Draf AI</Badge>
              <span>Sumber: <strong className="font-medium text-foreground">{result.source}</strong></span>
              <span aria-hidden="true">·</span>
              <span>Model: <strong className="font-medium text-foreground tabular-nums">{result.modelVersion}</strong></span>
            </div>
            <p className="leading-6">
              Cakupan data: headline, {skills.length} keahlian ({skills.slice(0, 3).join(", ") || "belum ada"}), target peran {activeTargetRole}.
            </p>
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Keterbatasan
              </p>
              <ul className="list-disc pl-5 space-y-1.5 leading-6">
                {result.limitations.map((lim, idx) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
