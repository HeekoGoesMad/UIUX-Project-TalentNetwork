"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";

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
    desc: "Evaluasi menyeluruh struktur CV, ringkasan profil, relevansi pengalaman, dan kesiapan sistem ATS.",
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

export function CareerAdvisorWorkspace() {
  const { cvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>("cv_review");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const about = cvProfile?.about || "Product designer yang fokus pada user research dan scalable design system.";
  const targetRole = cvProfile?.targetRole || "Product Designer";
  const skills = cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma", "User Journey Mapping"];

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
          targetRole,
          skills,
          location: cvProfile?.location || "Jakarta",
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil rekomendasi karier.");
      }

      const data: AdvisorResult = await response.json();
      setStreamProgress(0);
      setResult(data);
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

  // Fallback data for CV Review
  const cvReviewData: CvReviewDetails = result?.cvReviewDetails || {
    readinessLevel: skills.length >= 6 ? "Sangat Siap Kerja & ATS-Friendly" : "Cukup Siap (Perlu Pengayaan)",
    overallScore: Math.min(95, 72 + skills.length * 4),
    executiveSummary: `Analisis menyeluruh CV untuk target peran ${targetRole}: Struktur informasi dan pengalaman kerja relevan sudah solid. Keterbacaan sistem ATS optimal, dengan saran penguatan pada metrik hasil kuantitatif dan spesialisasi domain industri.`,
    sectionAudits: [
      {
        section: "1. Headline & Identitas Profesional",
        status: "good",
        notes: [`Menyebutkan istilah peran target (${targetRole}) secara eksplisit.`, "Format teks bersih tanpa karakter simbol yang membingungkan parser ATS."],
        recommendation: "Tambahkan domain industri (misal: Fintech/B2B SaaS) agar relevansi pencarian rekruter meningkat pesat.",
      },
      {
        section: "2. Ringkasan Profil (Tentang Saya / About)",
        status: "needs_improvement",
        notes: ["Belum merangkum total tahun pengalaman kerja secara terstruktur.", "Kata kunci inti masih bisa diperkaya di paragraf pembuka."],
        recommendation: "Gunakan pola 3-fokus: Peran & Nilai Utama, Keahlian Kunci, dan Bukti Dampak Kerja Nyata.",
      },
      {
        section: "3. Riwayat Pengalaman Kerja (Experience)",
        status: "needs_improvement",
        notes: ["Beberapa poin deskripsi masih berupa uraian tugas pasif.", "Pencantuman angka metrik hasil belum konsisten di semua proyek."],
        recommendation: "Gunakan Strong Action Verbs di awal setiap bullet point dan sertakan minimal 1 angka metrik (%, user, efisiensi waktu).",
      },
      {
        section: "4. Daftar Keahlian & Alat Kerja (Skills & Tools)",
        status: "good",
        notes: [`Terdaftar ${skills.length} keahlian relevan dengan standar industri ${targetRole}.`, "Kombinasi hard skill dan metodologi kerja sudah terlihat."],
        recommendation: "Kelompokkan skill ke dalam Hard Skills, Tools, dan Core Methodologies agar mudah dipindai rekruter dalam 6 detik.",
      },
      {
        section: "5. Pendidikan & Bukti Portofolio",
        status: "good",
        notes: ["Riwayat pendidikan tertera jelas dan tautan portofolio aktif."],
        recommendation: "Pastikan setiap proyek di portofolio mencantumkan peran spesifikmu dan metrik keberhasilan bisnis yang dicapai.",
      },
    ],
    formatChecks: [
      { check: "Standar Tipografi & Format Heading Baku", passed: true, tip: "Gunakan nama heading standar: Experience, Education, Skills, Portfolio." },
      { check: "Kepadatan Kata Kunci Inti (Keyword Density)", passed: true, tip: "Kata kunci target role tersebar alami di Headline, About, dan Experience." },
      { check: "Keterbacaan Bullet Points & Tata Letak", passed: true, tip: "Bullet point rapi tanpa simbol grafis rumit yang berisiko merusak parser ATS." },
      { check: "Kelengkapan Tautan Kontak & Keamanan Data", passed: true, tip: "Tautan LinkedIn, portofolio online, dan email kontak telah aktif dan valid." },
    ],
    priorityActionItems: [
      "Tambahkan metrik kuantitatif terukur (%, user base, efisiensi waktu) pada 2 pengalaman kerja teratas.",
      "Perkaya ringkasan 'About' dengan menyertakan domain spesialisasi industri (misal: SaaS, Fintech, E-Commerce).",
      "Kelompokkan skill teknis dan metodologi kerja agar mudah dipindai oleh hiring manager dalam 6 detik pertama.",
    ],
  };

  // Fallback data for Gap Analysis
  const gapData: GapAnalysisDetails = result?.gapAnalysisDetails || {
    targetRole,
    matchScore: 84,
    matchLevel: "Tinggi (Strong Alignment)",
    coreCompetencies: [
      {
        competency: "User Research & Usability Validation",
        candidateLevel: "Advanced",
        requiredLevel: "Advanced",
        status: "match",
        recommendation: "Pertahankan dan jadikan selling point utama saat sesi technical interview.",
      },
      {
        competency: "Scalable Design Systems & Tokenization",
        candidateLevel: "Intermediate",
        requiredLevel: "Advanced",
        status: "gap",
        recommendation: "Pelajari arsitektur design token multi-platform dan dokumentasikan studi kasusnya di portofolio.",
      },
      {
        competency: "Cross-functional Leadership & Stakeholder Management",
        candidateLevel: "Advanced",
        requiredLevel: "Intermediate",
        status: "exceeds",
        recommendation: "Keunggulan kompetitif yang kuat untuk posisi jenjang senior / lead.",
      },
      {
        competency: "Product Analytics & Growth Experimentation (A/B Testing)",
        candidateLevel: "Intermediate",
        requiredLevel: "Advanced",
        status: "gap",
        recommendation: "Sertakan metrik konversi dan pemahaman tools analytics (Mixpanel/Amplitude) di CV.",
      },
    ],
    criticalGaps: [
      "Pengalaman mengukur dampak desain pasca-rilis (A/B testing, funnel conversion) perlu lebih dipertegas di CV.",
      "Portofolio studi kasus perlu menyertakan arsitektur Design System berskala multi-platform.",
      "Perjelas peran kepemimpinan desain (mentoring junior designer atau ownership feature end-to-end).",
    ],
    transferableStrengths: [
      "Keahlian komunikasi lintas fungsi dan fasilitasi workshop desain dengan tim engineering & bisnis.",
      "Kemampuan sintesis data kualitatif dari riset pengguna menjadi solusi antarmuka yang bernilai bisnis.",
    ],
    strategicRecommendations: [
      "Tutup gap Design System dengan membuat 1 studi kasus mendalam tentang struktur token komponen di portofolio.",
      "Cantumkan tools analisis produk (misal: Amplitude, Hotjar, Google Analytics) di seksi keahlian.",
      "Tuliskan hasil kolaborasi dengan Product Manager dan Engineering Lead pada deskripsi pencapaian karir.",
    ],
  };

  // Fallback data for Career Roadmap
  const roadmapData: CareerRoadmapDetails = result?.careerRoadmapDetails || {
    targetRole,
    targetTimeline: "6 — 12 Bulan",
    targetLevel: "Senior to Lead Level",
    phases: [
      {
        phaseNumber: 1,
        phaseName: "Fondasi & Penutupan Gap Kompetensi",
        timeframe: "Bulan 1 — 3",
        outcome: "Portofolio siap standar industri dan gap skill utama tertutup sempurna.",
        keyActions: [
          "Audit dan poles poin pengalaman kerja di CV dengan metrik kuantitatif nyata",
          "Dokumentasikan 1 studi kasus mendalam tentang scalable design system & analytics di portofolio",
          "Pelajari materi lanjutan terkait product strategy & business metrics",
        ],
        milestone: "CV & Portofolio mencapai standar review ATS 90%+",
      },
      {
        phaseNumber: 2,
        phaseName: "Pembuktian Dampak & Personal Branding",
        timeframe: "Bulan 3 — 6",
        outcome: "Diakui sebagai talent spesialis dan mulai menerima tawaran karir relevan.",
        keyActions: [
          "Publikasikan tulisan insight desain atau studi kasus di LinkedIn / Medium",
          "Aktif di ProofyLink Talent Network untuk mendapatkan verified badge",
          "Mulai mengambil inisiatif kepemimpinan proyek atau mentoring anggota tim",
        ],
        milestone: "Mendapatkan 3-5 undangan wawancara atau penawaran kerja privat",
      },
      {
        phaseNumber: 3,
        phaseName: "Akselerasi Karir & Kesiapan Promosi",
        timeframe: "Bulan 6 — 12",
        outcome: "Mencapai peran target impian dengan kompensasi dan posisi optimal.",
        keyActions: [
          "Lakukan simulasi mock interview teknis & behavioral leadership",
          "Negosiasi penawaran kerja / evaluasi kenaikan jenjang ke posisi Senior/Lead",
          "Susun rencana kerja strategis (90-day plan) untuk peran baru",
        ],
        milestone: "Penempatan resmi di posisi target idaman dengan kompensasi kompetitif",
      },
    ],
    recommendedCertifications: [
      "Enterprise Design Thinking & Scalable Systems Practitioner",
      "Data-Driven Product Design & Growth Strategy Certification",
      "Leadership & Agile Project Management for Tech Professionals",
    ],
    strategicAdvice: [
      "Fokuslah pada pencapaian hasil bisnis terukur, bukan sekadar daftar tugas harian.",
      "Bangun reputasi profesional dengan aktif membagikan pembelajaran dan hasil kerja nyata.",
      "Perbarui profil ProofyLink secara berkala setiap kali menyelesaikan proyek berdampak tinggi.",
    ],
  };

  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan evaluasi pilar '${selectedFocus.replace("_", " ").toUpperCase()}' untuk peran ${targetRole}, berikut ringkasan evaluasi:`,
    whatGood: [
      `Fokus spesialisasi pada ${skills.slice(0, 2).join(" & ") || "keahlian utama"} sudah konsisten.`,
      `Pengalaman kerja relevan dan mendukung klaim keahlian profesional.`,
    ],
    whatNotGood: [
      `Poin pengalaman kerja perlu diperkaya dengan angka metrik konkret (Metode STAR).`,
      `Kesesuaian kata kunci domain industri perlu diselaraskan dengan kebutuhan terkini.`,
    ],
    conclusion: `Terapkan rekomendasi di bawah untuk memaksimalkan daya tawar profilmu dan mempercepat pencapaian target karir.`,
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

      {/* ─── Profile Baseline Header ─── */}
      <Card className="no-print border-purple-200/60 bg-gradient-to-r from-purple-50/40 via-white to-purple-50/20 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#7C3AED] text-white shadow-xs">
                <User className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">
                    {cvProfile?.fullName || "Profil kamu"}
                  </h2>
                  <Badge variant="outline" className="border-purple-300 bg-purple-50 text-[#7C3AED] font-semibold">
                    Siap Ditingkatkan
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-700">{headline}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Peran Dituju: <span className="font-semibold text-foreground">{targetRole}</span> • {skills.length} Skill Terdaftar
                </p>
              </div>
            </div>

            <Link href="/candidate/cv">
              <Button variant="outline" size="sm" className="gap-2 border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50 rounded-xl font-medium">
                <FileText className="size-4" /> Edit di CV Workspace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

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
                className={`flex flex-col justify-between rounded-2xl border p-4.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isSelected
                    ? "border-[#7C3AED] bg-purple-50/50 ring-2 ring-[#7C3AED]/20 shadow-xs"
                    : "border-border bg-card hover:border-purple-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl ${
                        isSelected ? "bg-[#7C3AED] text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    {isSelected ? (
                      <Badge className="bg-[#7C3AED] text-[11px] text-white font-semibold">Aktif</Badge>
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

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => void runAdvisor()}
            disabled={loading}
            size="lg"
            className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-white shadow-sm rounded-xl px-6"
          >
            {loading ? (
              <>
                <Bot className="size-5 animate-spin" /> Menganalisis Profil...
              </>
            ) : (
              <>
                <Sparkles className="size-5 text-white" /> Analisis &amp; Hasilkan Rekomendasi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Advice Results ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-fade-up">
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-foreground">ProofyLink — Laporan Evaluasi Karier &amp; Profil AI</h1>
            <p className="text-sm text-muted-foreground">
              Kandidat: {cvProfile?.fullName || "Profil kamu"} | Peran Dituju: {targetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          <div className="no-print flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-[#7C3AED] gap-1 px-3 py-1 font-semibold text-xs">
                <Sparkles className="size-3.5" /> Hasil Analisis Siap
              </Badge>
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-xs text-[#7C3AED] font-mono animate-pulse">
                  <span className="inline-block size-2 rounded-full bg-[#7C3AED]" /> Memproses... ({streamProgress}%)
                </span>
              )}
            </div>

            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="gap-2 border-border text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <Download className="size-4 text-[#7C3AED]" /> Unduh Laporan PDF
            </Button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* ─── PILAR 1: REVIEW CV KESELURUHAN (CV REVIEW) ─── */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {(result.focus === "cv_review" || result.focus === "ats") && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileText className="size-5 text-[#7C3AED]" />
                      <CardTitle className="text-lg text-foreground">Review CV Keseluruhan &amp; Kesiapan ATS</CardTitle>
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
                  <div className="rounded-xl border border-purple-100 bg-purple-50/30 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                      <Sparkles className="size-4 text-[#7C3AED]" /> Ringkasan Eksekutif Evaluasi CV:
                    </span>
                    <p className="text-sm leading-relaxed text-slate-800">
                      {cvReviewData.executiveSummary}
                    </p>
                  </div>

                  {/* Priority Action Items */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Zap className="size-4 text-amber-500" /> Rekomendasi Perbaikan Prioritas:
                    </h4>
                    <div className="space-y-2">
                      {cvReviewData.priorityActionItems.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs text-xs text-slate-700">
                          <CheckCircle2 className="size-4 text-[#7C3AED] shrink-0 mt-0.5" />
                          <span className="leading-relaxed font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section Audits */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit per Bagian CV:</h4>
                    <div className="space-y-3">
                      {cvReviewData.sectionAudits.map((sec, i) => (
                        <div key={i} className="rounded-xl border p-4 bg-white space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm font-bold text-foreground">{sec.section}</strong>
                            <Badge variant="outline" className={sec.status === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]" : "bg-amber-50 text-amber-800 border-amber-200 text-[11px]"}>
                              {sec.status === "good" ? "✓ Sudah Baik" : "⚠️ Perlu Penguatan"}
                            </Badge>
                          </div>
                          <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                            {sec.notes.map((n, ni) => (
                              <li key={ni}>{n}</li>
                            ))}
                          </ul>
                          <p className="text-xs bg-slate-50 p-2.5 rounded-lg border text-slate-700">
                            <strong>Saran Perbaikan:</strong> {sec.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Format & Readability Checks */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pemeriksaan Format &amp; Keterbacaan ATS:</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {cvReviewData.formatChecks.map((check, i) => (
                        <div key={i} className="rounded-xl border p-3 bg-white flex items-start gap-2.5 shadow-2xs">
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
                <CardHeader className="bg-purple-50/50 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Target className="size-5 text-[#7C3AED]" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Gap Analysis &amp; Evaluasi Karir Hari Ini</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target Peran: <span className="font-semibold text-foreground">{gapData.targetRole}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Kecocokan Profil:</span>
                      <Badge className="bg-[#7C3AED] text-white text-xs font-bold px-3 py-1">
                        {gapData.matchScore}% Match ({gapData.matchLevel})
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Core Competencies Matrix */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Layers className="size-4 text-[#7C3AED]" /> Matriks Evaluasi Kompetensi Inti:
                    </h4>
                    <div className="space-y-3">
                      {gapData.coreCompetencies.map((comp, i) => (
                        <div key={i} className="rounded-xl border p-4 bg-white space-y-2 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <strong className="text-sm font-bold text-foreground">{comp.competency}</strong>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground">
                                Levelmu: <strong className="text-slate-800">{comp.candidateLevel}</strong> / Target: <strong className="text-slate-800">{comp.requiredLevel}</strong>
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
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border">
                              <strong>Rekomendasi Peningkatan:</strong> {comp.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2-Column: Critical Gaps vs Transferable Strengths */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
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
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
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
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                      <Lightbulb className="size-4 text-amber-500" /> Rekomendasi Aksi Peningkatan Hari Ini:
                    </span>
                    <ul className="text-xs space-y-1.5 text-slate-700 list-disc pl-4">
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
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="size-5 text-[#7C3AED]" />
                      <div>
                        <CardTitle className="text-lg text-foreground">Career Roadmap &amp; Rencana Aksi Terstruktur</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Jalur Pertumbuhan: <span className="font-semibold text-foreground">{targetRole}</span> → <span className="font-semibold text-purple-700">{roadmapData.targetLevel}</span>
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-semibold px-3 py-1">
                      Estimasi Waktu: {roadmapData.targetTimeline}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Multi-Phase Roadmap Timeline */}
                  <div className="space-y-4">
                    {roadmapData.phases.map((phase) => (
                      <div key={phase.phaseNumber} className="rounded-2xl border p-5 bg-white shadow-2xs space-y-3.5 hover:border-purple-300 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-7 items-center justify-center rounded-xl bg-[#7C3AED] text-white text-xs font-bold shadow-2xs">
                              {phase.phaseNumber}
                            </span>
                            <div>
                              <h4 className="font-bold text-sm text-foreground">{phase.phaseName}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="size-3 text-slate-400" /> {phase.timeframe}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                            Target Outcome: {phase.outcome}
                          </span>
                        </div>

                        {/* Actions Checklist */}
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Langkah Aksi Konkret:</span>
                          <div className="grid gap-2 sm:grid-cols-3">
                            {phase.keyActions.map((action, ai) => (
                              <div key={ai} className="flex items-start gap-2 rounded-xl bg-slate-50/80 p-3 border border-slate-200/70 text-xs text-slate-700">
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
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="size-4 text-[#7C3AED]" /> Rekomendasi Sertifikasi &amp; Program Belajar:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {roadmapData.recommendedCertifications.map((cert, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 bg-white border text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-2xs">
                          <BookOpen className="size-3.5 text-[#7C3AED]" /> {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Career Navigation Advice */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                      <Compass className="size-4 text-purple-700" /> Tips Akselerasi Karir Masa Depan:
                    </span>
                    <ul className="text-xs space-y-1.5 text-slate-700 list-disc pl-4">
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
          <Card className="no-print border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-purple-50/20 shadow-xs">
            <CardHeader className="pb-3 border-b bg-white/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="size-4.5 text-[#7C3AED]" /> Rangkuman Saran &amp; Langkah Selanjutnya
              </CardTitle>
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

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Gunakan rekomendasi evaluasi di atas untuk memperbarui profil dan portofoliomu.
                </p>
                <Link href="/candidate/cv">
                  <Button className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-xl shadow-xs">
                    <FileText className="size-4" /> Buka CV Workspace &amp; Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Disclosure Footer */}
          <div className="rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-mono uppercase tracking-wider text-[#7C3AED] font-bold flex items-center gap-1.5 text-[11px]">
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
