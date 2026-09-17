"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import {
    AlertTriangle,
    Award,
    BookOpen,
    Bot,
    Calendar,
    Check,
    CheckCircle2,
    Compass,
    Copy,
    Download,
    FileText,
    GraduationCap,
    Layers,
    Lightbulb,
    ShieldAlert,
    SlidersHorizontal,
    Sparkles,
    Target,
    TrendingUp,
    Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { checkSkillsQuality } from "@/lib/ai/skills-check";

export type FocusType = "cv_review" | "gap_analysis" | "career_roadmap" | "ats" | "headline" | "star";

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

interface CvReviewDetails {
  readinessLevel: string;
  overallScore: number;
  executiveSummary: string;
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

interface RoadmapPhase {
  phaseNumber: number;
  phaseName: string;
  timeframe: string;
  outcome: string;
  keyActions: string[];
  milestone: string;
}

interface CareerRoadmapDetails {
  targetRole: string;
  targetTimeline: string;
  targetLevel: string;
  phases: RoadmapPhase[];
  recommendedCertifications: string[];
  strategicAdvice: string[];
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
  careerRoadmapDetails?: CareerRoadmapDetails;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure" | "local";
}

const focusPresets: { id: FocusType; label: string; icon: typeof FileText; desc: string; badge: string }[] = [
  {
    id: "cv_review",
    label: "Review CV Keseluruhan",
    icon: FileText,
    desc: "Evaluasi menyeluruh susunan CV, ringkasan profil, relevansi pengalaman, dan kemudahan dibaca perekrut.",
    badge: "Pilar 1",
  },
  {
    id: "gap_analysis",
    label: "Gap Analysis Karir",
    icon: Target,
    desc: "Cek karir hari ini: Analisis kesenjangan skill & kompetensi saat ini terhadap ekspektasi peran impian.",
    badge: "Pilar 2",
  },
  {
    id: "career_roadmap",
    label: "Career Roadmap",
    icon: TrendingUp,
    desc: "Rencana karir kedepan: Panduan tahapan strategis dan aksi konkret jangka pendek hingga panjang.",
    badge: "Pilar 3",
  },
];

export function CareerAdvisorWorkspace({ initialFocus = "cv_review" }: { initialFocus?: FocusType } = {}) {
  const { cvProfile, user, saveCvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>(initialFocus);
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const about = cvProfile?.about || "Product designer yang fokus pada user research dan perancangan antarmuka digital.";
  const defaultTargetRole = cvProfile?.targetRole || "Product Designer";
  const skills = useMemo(() => cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma", "User Journey Mapping"], [cvProfile?.skills]);

  const [customRoleInput, setCustomRoleInput] = useState<string | null>(null);
  const [customInstruction, setCustomInstruction] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [appliedToCv, setAppliedToCv] = useState(false);

  // Sync initialFocus when prop changes
  const [prevInitialFocus, setPrevInitialFocus] = useState(initialFocus);
  if (initialFocus !== prevInitialFocus) {
    setPrevInitialFocus(initialFocus);
    setSelectedFocus(initialFocus);
  }

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

  const activeTargetRole = (customRoleInput !== null ? customRoleInput.trim() : "") || defaultTargetRole;

  const skillCheck = useMemo(() => checkSkillsQuality(skills, activeTargetRole), [skills, activeTargetRole]);

  const quickPrompts = [
    "Perjelas bukti hasil kerja nyata (angka % & efisiensi waktu)",
    "Optimalkan kata kunci agar mudah lolos seleksi perekrut",
    "Fokus transisi ke jenjang karir yang lebih tinggi",
    "Perkuat relevansi portofolio & studi kasus proyek",
  ];

  function applyQuickPrompt(promptText: string) {
    setCustomInstruction((prev) => {
      if (!prev.trim()) return promptText;
      if (prev.includes(promptText)) return prev;
      return `${prev}, ${promptText}`;
    });
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

  async function runAdvisor() {
    setLoading(true);
    setIsStreaming(false);
    setResult(null);
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
          customInstruction: customInstruction.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Gagal mengambil rekomendasi karier.");
      }

      setStreamProgress(0);
      setResult(data as AdvisorResult);
      setIsStreaming(true);
      toast.success("Analisis rekomendasi karier berhasil dihasilkan!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat memproses data.");
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPdf() {
    window.print();
  }

  function handleCopyAdvice() {
    if (!result) return;
    const textToCopy = `ProofyLink Career Advisor - Evaluasi ${selectedFocus.toUpperCase()}\nTarget Peran: ${activeTargetRole}\n\nRingkasan:\n${result.summary}\n\nSaran Utama:\n- Hal Baik: ${adviceData.whatGood.join("; ")}\n- Perlu Penguatan: ${adviceData.whatNotGood.join("; ")}\n\nLangkah Selanjutnya:\n${result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Rangkuman rekomendasi AI berhasil disalin ke clipboard!");
  }

  // Fallback data for CV Review
  const cvReviewData: CvReviewDetails = result?.cvReviewDetails || {
    readinessLevel: skillCheck.isPlausible
      ? (skills.length >= 6 ? "Sangat Siap & Mudah Dipindai" : "Cukup Siap (Perlu Pengayaan)")
      : "Perlu Penyesuaian Keahlian",
    overallScore: skillCheck.isPlausible
      ? Math.min(95, 72 + skills.length * 4)
      : 48,
    executiveSummary: skillCheck.isPlausible
      ? `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Struktur informasi dan riwayat pengalaman kerja sudah rapi serta mudah dibaca oleh perekrut. Rekomendasi utama adalah melengkapi bukti hasil kerja nyata dan memperjelas keahlian unggulanmu.`
      : `Analisis menyeluruh CV untuk target posisi ${activeTargetRole}: Susunan dasar CV sudah rapi, namun keahlian yang tercantum saat ini (${skills.join(", ") || "belum lengkap"}) belum sesuai dengan kebutuhan posisi ${activeTargetRole}. Prioritaskan perbaikan kompetensi agar sesuai dengan standar industri.`,
    sectionAudits: [
      {
        section: "1. Headline & Identitas Profesional",
        status: "good",
        notes: [
          `Menyebutkan istilah peran target (${activeTargetRole}) secara jelas dan profesional.`,
          "Format teks bersih, rapi, dan mudah dibaca oleh sistem seleksi maupun tim perekrut."
        ],
        recommendation: "Tambahkan bidang industri yang kamu minati (misal: teknologi, keuangan, atau retail) agar profilmu semakin mudah ditemukan perekrut.",
      },
      {
        section: "2. Ringkasan Profil (Tentang Saya / About)",
        status: "needs_improvement",
        notes: [
          "Belum merangkum total tahun pengalaman kerja secara ringkas.",
          "Kalimat pembuka masih bisa diperkuat dengan nilai tambah atau pencapaian terbaikmu."
        ],
        recommendation: "Gunakan pola 3-bagian: Peran utama, Keahlian andalan, dan Bukti hasil kerja nyata yang pernah dicapai.",
      },
      {
        section: "3. Riwayat Pengalaman Kerja (Experience)",
        status: "needs_improvement",
        notes: [
          "Sebagian poin deskripsi masih berupa uraian tugas harian biasa.",
          "Belum konsisten menyertakan bukti hasil kerja nyata (misal: persentase keberhasilan, jumlah proyek, efisiensi waktu)."
        ],
        recommendation: "Gunakan kata kerja aktif yang jelas di awal setiap poin (misal: Mengembangkan, Memimpin, Merancang) dan sertakan contoh hasil nyata.",
      },
      {
        section: "4. Daftar Keahlian & Alat Kerja (Skills & Tools)",
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
        section: "5. Pendidikan & Bukti Portofolio",
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
    matchLevel: skillCheck.isPlausible ? "Tinggi (Selaras Baik)" : "Perlu Penyesuaian Kompetensi",
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
          "Cantumkan alat kerja (tools) yang kamu kuasai secara jelas di bagian keahlian.",
          "Tuliskan kontribusimu bersama tim pada deskripsi pencapaian karir.",
        ]
      : [
          `Perbarui profil dengan mempelajari keahlian dasar untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")}).`,
          "Buat minimal satu proyek sederhana atau studi kasus untuk membuktikan kemampuanmu.",
          "Ikuti kursus atau pelatihan daring untuk membangun fondasi keahlian yang dibutuhkan.",
        ],
  };

  // Fallback data for Career Roadmap
  const roadmapData: CareerRoadmapDetails = result?.careerRoadmapDetails || {
    targetRole: activeTargetRole,
    targetTimeline: "6 — 12 Bulan",
    targetLevel: skillCheck.isPlausible ? "Senior to Lead Level" : `Kandidat Siap Kerja untuk ${activeTargetRole}`,
    phases: [
      {
        phaseNumber: 1,
        phaseName: skillCheck.isPlausible ? "Fondasi & Penutupan Gap Kompetensi" : "Penyelarasan & Pembangunan Keahlian Inti",
        timeframe: "Bulan 1 — 3",
        outcome: skillCheck.isPlausible
          ? "Portofolio siap standar industri dan gap skill utama tertutup."
          : `Keahlian inti untuk posisi ${activeTargetRole} mulai dikuasai dan portofolio awal terbentuk.`,
        keyActions: skillCheck.isPlausible
          ? [
              "Audit dan poles poin pengalaman kerja di CV dengan bukti hasil kerja nyata",
              "Dokumentasikan 1 studi kasus mendalam tentang proyek relevan di portofolio",
              "Pelajari materi lanjutan terkait strategi kerja dan pemecahan masalah bisnis",
            ]
          : [
              `Fokus pelajari 2-3 keahlian utama untuk posisi ${activeTargetRole} (misal: ${skillCheck.recommendedSkillsForRole.slice(0, 3).join(", ")})`,
              "Perbarui daftar keahlian di CV setelah menguasai materi baru",
              "Buat 1 proyek latihan terstruktur sebagai bukti portofolio awal",
            ],
        milestone: skillCheck.isPlausible
          ? "CV & Portofolio siap lolos seleksi awal perekrut dengan tingkat keterbacaan tinggi"
          : `Keahlian di profil selaras dengan kebutuhan peran ${activeTargetRole}`,
      },
      {
        phaseNumber: 2,
        phaseName: "Pembuktian Hasil Kerja & Personal Branding",
        timeframe: "Bulan 3 — 6",
        outcome: "Diakui sebagai talent yang kompeten dan mulai menerima kesempatan wawancara relevan.",
        keyActions: [
          "Publikasikan tulisan wawasan atau studi kasus proyek di LinkedIn atau komunitas profesional",
          "Aktif di ProofyLink Talent Network untuk mendapatkan verified badge",
          "Mulai mengambil inisiatif kolaborasi atau memimpin tugas proyek mandiri",
        ],
        milestone: "Mendapatkan undangan wawancara atau tawaran kerja yang relevan",
      },
      {
        phaseNumber: 3,
        phaseName: "Akselerasi Karir & Kesiapan Promosi",
        timeframe: "Bulan 6 — 12",
        outcome: "Mencapai peran target impian dengan posisi dan kompensasi optimal.",
        keyActions: [
          "Lakukan simulasi wawancara kerja teknis dan situasional",
          "Evaluasi tawaran kerja atau peluang jenjang karir yang lebih tinggi",
          "Susun rencana kerja awal (rencana 90 hari) untuk posisi baru",
        ],
        milestone: "Penempatan resmi di posisi target idaman dengan kompensasi kompetitif",
      },
    ],
    recommendedCertifications: [
      `Sertifikasi Profesional Bidang ${activeTargetRole}`,
      "Pelatihan Praktis Analisis & Strategi Kerja",
      "Pelatihan Manajemen Proyek & Kolaborasi Tim",
    ],
    strategicAdvice: [
      "Fokuslah pada pencapaian hasil kerja nyata yang bermanfaat, bukan sekadar daftar tugas harian.",
      "Bangun reputasi profesional dengan aktif membagikan pembelajaran dan hasil kerja nyata.",
      "Perbarui profil ProofyLink secara berkala setiap kali menyelesaikan proyek berdampak positif.",
    ],
  };

  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan evaluasi pilar '${selectedFocus.replace("_", " ").toUpperCase()}' untuk posisi ${activeTargetRole}, berikut beberapa poin penting:`,
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

      {/* ─── 3 Main Pillars Selection ─── */}
      <div className="no-print space-y-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Pilih 3 Pilar Evaluasi Profil</h2>
          <p className="text-xs text-muted-foreground">
            Pilih aspek yang ingin kamu evaluasi hari ini untuk mendapatkan analisis mendalam dan rekomendasi instan:
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
                onClick={() => setSelectedFocus(preset.id)}
                className={`flex flex-col justify-between rounded-2xl border p-4.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-xs ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/20"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    {isSelected ? (
                      <Badge className="bg-primary text-primary-foreground text-[11px] font-semibold">Aktif</Badge>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground">{preset.badge}</span>
                    )}
                  </div>
                  <h3 className="mt-3.5 font-bold text-sm text-foreground">{preset.label}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── Command Controls & Custom Instructions Panel ─── */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Kontrol Perintah AI &amp; Target Peran (Opsional)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {showAdvanced ? "Sembunyikan Pintasan" : "Pintasan Perintah Cepat"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Target Posisi / Peran yang Ingin Diuji:
              </label>
              <Input
                value={customRoleInput !== null ? customRoleInput : defaultTargetRole}
                onChange={(e) => setCustomRoleInput(e.target.value)}
                placeholder="misal: Senior Product Designer, Lead UX..."
                className="bg-card text-xs border-border focus-visible:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Catatan / Instruksi Khusus ke AI:
              </label>
              <Input
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="misal: Fokus industri Fintech SaaS, tekankan kepemimpinan..."
                className="bg-card text-xs border-border focus-visible:ring-primary"
              />
            </div>
          </div>

          {showAdvanced && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Pintasan Perintah Cepat (Klik untuk menyisipkan ke instruksi):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyQuickPrompt(qp)}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-card border border-border text-foreground hover:bg-muted/40 hover:border-primary/30 transition-colors font-medium shadow-2xs"
                  >
                    <Sparkles className="size-3 text-primary" /> {qp}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Evaluasi akan dijalankan untuk pilar:{" "}
              <strong className="text-primary font-semibold">
                {focusPresets.find((p) => p.id === selectedFocus)?.label}
              </strong>
            </p>
            <Button
              onClick={() => void runAdvisor()}
              disabled={loading}
              size="lg"
              className="gap-2 font-semibold shadow-xs rounded-xl px-6"
            >
              {loading ? (
                <>
                  <Bot className="size-4.5 animate-spin" /> Menganalisis Profil...
                </>
              ) : (
                <>
                  <Sparkles className="size-4.5" /> Analisis &amp; Hasilkan Rekomendasi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Advice Results ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-fade-up">
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">ProofyLink — Laporan Evaluasi Karier &amp; Profil AI</h1>
            <p className="text-sm text-muted-foreground">
              Kandidat: {cvProfile?.fullName || "Profil kamu"} | Peran Dituju: {activeTargetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary gap-1 px-3 py-1 font-semibold text-xs">
                <Sparkles className="size-3.5" /> Hasil Analisis Siap
              </Badge>
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-xs text-primary font-mono animate-pulse">
                  <span className="inline-block size-2 rounded-full bg-primary" /> Memproses... ({streamProgress}%)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleCopyAdvice}
                variant="outline"
                size="sm"
                className="gap-1.5 border-border text-foreground hover:bg-muted/40 rounded-xl text-xs"
              >
                <Copy className="size-3.5 text-primary" /> Salin Rekomendasi
              </Button>
              <Button
                onClick={handleDownloadPdf}
                variant="outline"
                size="sm"
                className="gap-1.5 border-border text-foreground hover:bg-muted/40 rounded-xl text-xs"
              >
                <Download className="size-3.5 text-primary" /> Unduh PDF
              </Button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 1: REVIEW CV KESELURUHAN (CV REVIEW) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "cv_review" || result.focus === "ats") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-5 text-primary" />
                      <CardTitle className="text-lg text-foreground">Review CV Keseluruhan &amp; Kesiapan Melamar Kerja</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Status Kesiapan:</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                        <span className="size-2 rounded-full bg-current" />
                        {cvReviewData.readinessLevel}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Executive Summary */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Sparkles className="size-4 text-primary" /> Ringkasan Eksekutif Evaluasi CV:
                    </span>
                    <p className="text-sm leading-relaxed text-foreground">
                      {cvReviewData.executiveSummary}
                    </p>
                  </div>

                  {/* Priority Action Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Zap className="size-4 text-amber-500" /> Rekomendasi Perbaikan Prioritas:
                    </h4>
                    <div className="space-y-2">
                      {cvReviewData.priorityActionItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-border bg-card p-3 shadow-2xs text-xs text-foreground">
                          <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section Audits */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit per Bagian CV:</h4>
                    <div className="space-y-3">
                      {cvReviewData.sectionAudits.map((sec, i) => (
                        <div key={i} className="rounded-xl border p-4 bg-card space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm font-semibold text-foreground">{sec.section}</strong>
                            <Badge variant="outline" className={sec.status === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]" : "bg-amber-50 text-amber-800 border-amber-200 text-[11px]"}>
                              {sec.status === "good" ? "✓ Sudah Baik" : "⚠️ Perlu Penguatan"}
                            </Badge>
                          </div>
                          <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                            {sec.notes.map((n, ni) => (
                              <li key={ni}>{n}</li>
                            ))}
                          </ul>
                          <p className="text-xs bg-muted/40 p-2.5 rounded-lg border text-foreground">
                            <strong>Saran Perbaikan:</strong> {sec.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Format & Readability Checks */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pemeriksaan Kerapian Format &amp; Keterbacaan Rekruter:</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cvReviewData.formatChecks.map((check, i) => (
                        <div key={i} className="rounded-xl border p-3 bg-card flex items-start gap-2.5 shadow-2xs">
                          {check.passed ? (
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div className="text-xs">
                            <strong className="block text-foreground">{check.check}</strong>
                            <span className="text-muted-foreground mt-0.5 block leading-relaxed">{check.tip}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Target className="size-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Gap Analysis &amp; Evaluasi Karir Hari Ini</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target Peran: <span className="font-semibold text-foreground">{gapData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Kecocokan Profil:</span>
                      <Badge className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1">
                        {gapData.matchScore}% Match ({gapData.matchLevel})
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Core Competencies Matrix */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="size-4 text-primary" /> Matriks Evaluasi Kompetensi Inti:
                    </h4>
                    <div className="space-y-3">
                      {gapData.coreCompetencies.map((comp, i) => (
                        <div key={i} className="rounded-xl border p-4 bg-card space-y-2 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <strong className="text-sm font-semibold text-foreground">{comp.competency}</strong>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Levelmu: <strong className="text-foreground font-semibold">{comp.candidateLevel}</strong> / Target: <strong className="text-foreground font-semibold">{comp.requiredLevel}</strong>
                              </span>
                              <Badge
                                className={
                                  comp.status === "match"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold"
                                    : comp.status === "exceeds"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold"
                                    : "bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold"
                                }
                              >
                                {comp.status === "match" ? "✓ Match" : comp.status === "exceeds" ? "★ Exceeds" : "⚡ Gap Ditemukan"}
                              </Badge>
                            </div>
                          </div>
                          {comp.recommendation && (
                            <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border">
                              <strong className="text-foreground">Rekomendasi Peningkatan:</strong> {comp.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column: Critical Gaps vs Transferable Strengths */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-amber-600" /> Kesenjangan Kritis yang Perlu Ditutup:
                      </span>
                      <ul className="space-y-2 text-xs text-amber-950">
                        {gapData.criticalGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="size-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Keunggulan Unik &amp; Kekuatan Transferable:
                      </span>
                      <ul className="space-y-2 text-xs text-emerald-950">
                        {gapData.transferableStrengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="size-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strategic Upskilling Action Items */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Lightbulb className="size-4 text-amber-500" /> Rekomendasi Aksi Peningkatan Hari Ini:
                    </span>
                    <ul className="text-xs space-y-1.5 text-foreground list-disc pl-4">
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
          {/* ─── PILAR 3: CAREER ROADMAP (RENCANA KARIR KEDEPAN) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "career_roadmap" || result.focus === "star") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="size-5 text-primary" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Career Roadmap &amp; Rencana Aksi Terstruktur</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Jalur Pertumbuhan: <span className="font-semibold text-foreground">{activeTargetRole}</span> → <span className="font-semibold text-primary">{roadmapData.targetLevel}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs font-semibold px-3 py-1">
                      Estimasi Waktu: {roadmapData.targetTimeline}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Multi-Phase Roadmap Timeline */}
                  <div className="space-y-4">
                    {roadmapData.phases.map((phase) => (
                      <div key={phase.phaseNumber} className="rounded-2xl border p-5 bg-card shadow-2xs space-y-3.5 hover:border-primary/40 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xs">
                              {phase.phaseNumber}
                            </span>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{phase.phaseName}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="size-3 text-muted-foreground" /> {phase.timeframe}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/20">
                            Target Outcome: {phase.outcome}
                          </span>
                        </div>

                        {/* Actions Checklist */}
                        <div className="space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Langkah Aksi Konkret:</span>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {phase.keyActions.map((action, ai) => (
                              <div key={ai} className="flex items-start gap-2 rounded-xl bg-muted/30 p-3 border border-border/80 text-xs text-foreground">
                                <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Milestone Banner */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <Award className="size-4 text-emerald-600" /> Key Milestone: {phase.milestone}
                          </span>
                          <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">Tercapai Saat Selesai</Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommended Certifications */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GraduationCap className="size-4 text-primary" /> Rekomendasi Sertifikasi &amp; Program Belajar:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.recommendedCertifications.map((cert, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 bg-card border text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs">
                          <BookOpen className="size-3.5 text-primary" /> {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Career Navigation Advice */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Compass className="size-4 text-primary" /> Tips Akselerasi Karir Masa Depan:
                    </span>
                    <ul className="text-xs space-y-1.5 text-foreground list-disc pl-4">
                      {roadmapData.strategicAdvice.map((advice, i) => (
                        <li key={i}>{advice}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Executive Summary & Action Steps ─── */}
          <Card className="no-print border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="size-4.5 text-primary" /> Rangkuman Saran &amp; Langkah Selanjutnya
              </CardTitle>
              <Button
                size="sm"
                variant={appliedToCv ? "outline" : "default"}
                onClick={handleApplyToCv}
                className="shrink-0 gap-1.5 text-xs font-semibold"
              >
                <Sparkles className="size-3.5" />
                {appliedToCv ? "Tersinkron ke CV ✓" : "Terapkan Saran ke CV"}
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Hal yang Sudah Baik:
                  </span>
                  <ul className="space-y-1.5 text-emerald-950 list-disc pl-4">
                    {adviceData.whatGood.map((good, idx) => (
                      <li key={idx}>{good}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-amber-600" /> Area yang Perlu Penguatan:
                  </span>
                  <ul className="space-y-1.5 text-amber-950 list-disc pl-4">
                    {adviceData.whatNotGood.map((bad, idx) => (
                      <li key={idx}>{bad}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60">
                <p className="text-xs text-muted-foreground">
                  Gunakan rekomendasi evaluasi di atas untuk memperbarui profil dan portofoliomu.
                </p>
                <Link href="/candidate/cv">
                  <Button className="gap-2 font-semibold rounded-xl shadow-xs">
                    <FileText className="size-4" /> Buka CV Workspace &amp; Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Disclosure Footer */}
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-mono uppercase tracking-wider text-primary font-semibold flex items-center gap-1.5 text-[11px]">
                <Bot className="size-3.5" /> Dihasilkan oleh Antarmuka AI ProofyLink
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Sumber: <strong className="uppercase">{result.source}</strong></span>
                <span>•</span>
                <span>Model: <strong>{result.modelVersion}</strong></span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                <ShieldAlert className="size-3.5 text-amber-600" /> Catatan Penting:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
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
