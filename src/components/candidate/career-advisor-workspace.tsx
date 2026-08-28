"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileText,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Target,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";

type FocusType = "ats" | "headline" | "star";

interface StarBullet {
  before: string;
  after: string;
  impactReason: string;
  metricsHighlight?: string;
}

interface StructuredAdvice {
  opening: string;
  whatGood: string[];
  whatNotGood: string[];
  conclusion: string;
}

interface AtsDetails {
  readinessLevel: "Sangat Siap ATS" | "Cukup Siap" | "Perlu Penguatan";
  detectedKeywords: string[];
  missingKeywords: string[];
  sectionAudits: Array<{
    section: string;
    status: "good" | "needs_improvement";
    notes: string[];
    recommendation: string;
  }>;
  formatChecks: Array<{
    check: string;
    passed: boolean;
    tip: string;
  }>;
}

interface HeadlineOption {
  headline: string;
  rationale: string;
  keywords: string[];
  tag: string;
}

interface HeadlineDetails {
  currentHeadline: string;
  formula: string;
  options: HeadlineOption[];
  tips: string[];
}

interface StarDetails {
  frameworkExplanation: string;
  bullets: Array<{
    before: string;
    after: string;
    impactReason: string;
    metricsHighlight: string;
  }>;
  actionVerbs: string[];
}

interface AdvisorResult {
  focus: FocusType;
  summary: string;
  headlineSuggestions: string[];
  starBullets: StarBullet[];
  structuredAdvice?: StructuredAdvice;
  atsDetails?: AtsDetails;
  headlineDetails?: HeadlineDetails;
  starDetails?: StarDetails;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure" | "local";
}

const focusPresets: { id: FocusType; label: string; icon: typeof Sparkles; desc: string }[] = [
  {
    id: "ats",
    label: "Optimasi ATS & Kata Kunci",
    icon: FileCheck,
    desc: "Evaluasi kesiapan kata kunci dan audit format profil untuk lolos parser ATS.",
  },
  {
    id: "headline",
    label: "Penyusunan Headline Profesional",
    icon: Sparkles,
    desc: "Rekomendasi 3 variasi kalimat pembuka yang memikat hiring manager.",
  },
  {
    id: "star",
    label: "Poles Pencapaian (Metode STAR)",
    icon: Target,
    desc: "Ubah deskripsi tugas biasa menjadi pencapaian terukur dengan angka & aksi nyata.",
  },
];

export function CareerAdvisorWorkspace() {
  const { cvProfile, saveCvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>("ats");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [streamProgress, setStreamProgress] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const about = cvProfile?.about || "Product designer yang fokus pada user research dan design system.";
  const targetRole = cvProfile?.targetRole || "Product Designer";
  const skills = cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma"];

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

  function handleCopy(text: string, labelText: string) {
    void navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${labelText} disalin ke clipboard!`);
    setTimeout(() => setCopiedText(null), 2500);
  }

  async function handleApplyHeadline(newHeadline: string) {
    if (!cvProfile) return;
    try {
      await saveCvProfile({
        ...cvProfile,
        headline: newHeadline,
      });
      toast.success("Headline berhasil diterapkan ke profil CV!");
    } catch {
      toast.error("Gagal menerapkan headline ke profil.");
    }
  }

  function handleDownloadPdf() {
    window.print();
  }

  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan evaluasi profil untuk posisi target ${targetRole}, berikut tinjauan utama:`,
    whatGood: [
      `Fokus spesialisasi pada ${skills.slice(0, 2).join(" & ") || "keahlian utama"} sudah terlihat jelas.`,
      `Pengalaman kerja relevan dan mendukung klaim keahlian.`,
    ],
    whatNotGood: [
      `Poin pengalaman kerja perlu diperkaya dengan angka metrik konkret (Metode STAR).`,
      `Kata kunci spesifik industri perlu ditingkatkan agar lebih ramah terhadap penyaringan ATS.`,
    ],
    conclusion: `Perbarui headline profil dan tambahkan metrik pencapaian untuk meningkatkan peluang dipanggil interview.`,
  };

  const atsData: AtsDetails = result?.atsDetails || {
    readinessLevel: skills.length >= 6 ? "Sangat Siap ATS" : skills.length >= 3 ? "Cukup Siap" : "Perlu Penguatan",
    detectedKeywords: skills.slice(0, 5),
    missingKeywords: ["Cross-functional Leadership", "Design Systems at Scale", "Conversion Rate Optimization (CRO)", "Product Analytics"],
    sectionAudits: [
      {
        section: "Headline & Identitas Profesional",
        status: "good",
        notes: [`Menyebutkan istilah peran target (${targetRole}) dengan jelas.`, "Format teks bersih tanpa karakter aneh."],
        recommendation: "Sertakan domain industri (misal: Fintech / SaaS) untuk memperkuat relevansi.",
      },
      {
        section: "Ringkasan Profil (Tentang Saya)",
        status: "needs_improvement",
        notes: ["Belum merangkum total tahun pengalaman secara eksplisit.", "Kata kunci inti masih bisa diperbanyak di paragraf awal."],
        recommendation: "Susun dalam 3 fokus: Peran & Nilai Utama, Keahlian Kunci, dan Dampak Kerja Nyata.",
      },
      {
        section: "Pengalaman Kerja (Riwayat Pekerjaan)",
        status: "needs_improvement",
        notes: ["Beberapa poin masih berupa uraian tugas rutin pasif.", "Perlu konsistensi pencantuman angka metrik."],
        recommendation: "Gunakan kata kerja aksi aktif di awal tiap bullet dan sertakan minimal 1 angka hasil (%, user, efisiensi waktu).",
      },
    ],
    formatChecks: [
      { check: "Standar Tipografi & Format Heading Baku", passed: true, tip: "Gunakan nama bagian baku: Pengalaman, Pendidikan, Keahlian." },
      { check: "Kepadatan Kata Kunci (Keyword Density)", passed: true, tip: "Pastikan kata kunci role target muncul secara natural di berbagai seksi." },
      { check: "Keterbacaan Bullet Point", passed: true, tip: "Gunakan bullet point standar tanpa simbol grafis rumit yang gagal diekstrak parser ATS." },
      { check: "Tautan Portofolio & Kontak Aktif", passed: true, tip: "Sertakan tautan LinkedIn, live URL portfolio, dan nomor WhatsApp aktif." },
    ],
  };

  const headlineData: HeadlineDetails = result?.headlineDetails || {
    currentHeadline: headline,
    formula: "[Peran Utama] | [Spesialisasi / Domain Unggulan] | [Dampak Terukur & Nilai Tambah]",
    options: [
      {
        headline: `${targetRole} | End-to-End Product Strategy & Design Systems for High-Growth Apps`,
        rationale: "Menonjolkan kemampuan end-to-end design dan strategi produk yang sangat dicari recruiter.",
        keywords: ["End-to-End Product Strategy", "Design Systems", "Product Growth"],
        tag: "Paling Direkomendasikan",
      },
      {
        headline: `Senior ${targetRole} • Data-Informed UX & Research Specialist (Fintech / E-Commerce)`,
        rationale: "Fokus kuat pada keahlian riset berbasis data kuantitatif dan domain industri spesifik.",
        keywords: ["Data-Informed UX", "UX Research", "Fintech & E-Commerce"],
        tag: "Fokus Spesialisasi",
      },
      {
        headline: `${targetRole} — Driving +30% User Conversion Through Frictionless Experience`,
        rationale: "Menonjolkan metrik dampak bisnis (conversion rate) yang langsung menarik perhatian hiring manager.",
        keywords: ["Conversion Rate Optimization", "Product Experience", "Business Impact"],
        tag: "Dampak Bisnis (Impact)",
      },
    ],
    tips: [
      "Gunakan tanda pipa (|) atau bullet (•) sebagai pemisah yang rapi dan mudah dibaca parser ATS.",
      "Hindari kata sifat generik seperti 'Hardworking' atau 'Creative Guru'.",
      "Selalu sertakan nama peran spesifik yang ingin kamu lamar (Target Role).",
      "Panjang ideal 120–160 karakter agar tidak terpotong di hasil pencarian recruiter.",
    ],
  };

  const starData: StarDetails = result?.starDetails || {
    frameworkExplanation: "Metode STAR (Situation, Task, Action, Result) adalah standar terbaik untuk menyusun poin pengalaman kerja yang meyakinkan hiring manager dan menembus sistem seleksi ATS.",
    bullets: (result?.starBullets?.length
      ? result.starBullets.map((b) => ({
          before: b.before,
          after: b.after,
          impactReason: b.impactReason,
          metricsHighlight: b.metricsHighlight || "Hasil Terukur",
        }))
      : [
          {
            before: "Bertanggung jawab merancang ulang tampilan antarmuka aplikasi produk utama.",
            after: "Memimpin redesign 12+ flow produk utama di aplikasi, meningkatkan task completion rate sebesar 28% dan memangkas waktu onboarding 15%.",
            impactReason: "Mengganti deskripsi tugas pasif dengan angka metrik konkret (%) dan kata kerja aksi 'Memimpin'.",
            metricsHighlight: "+28% Task Completion · -15% Onboarding Time",
          },
          {
            before: "Membuat komponen design system dan berkolaborasi dengan engineer frontend.",
            after: "Membangun & mendokumentasikan Design System (150+ komponen terstruktur), mempercepat siklus sprint tim hingga 35%.",
            impactReason: "Menjelaskan skala kontribusi nyata (150+ komponen) dan efisiensi delivery tim lintas fungsi.",
            metricsHighlight: "150+ Komponen Terstruktur · 35% Faster Delivery",
          },
          {
            before: "Melakukan riset pengguna dan interview responden untuk pengembangan fitur baru.",
            after: "Menjalankan 20+ sesi usability testing & wawancara mendalam, menurunkan drop-off rate pada alur transaksi sebesar 18%.",
            impactReason: "Menunjukkan volume riset dan dampak langsung pada metrik bisnis utama.",
            metricsHighlight: "20+ Sesi Riset · -18% Drop-off Rate",
          },
        ]),
    actionVerbs: ["Memimpin", "Mengoptimalkan", "Membangun", "Merancang", "Meningkatkan", "Memangkas"],
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
            Pilih aspek yang ingin kamu pertajam hari ini untuk mendapatkan evaluasi dan rekomendasi instan:
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
                    {isSelected && (
                      <Badge className="bg-[#7C3AED] text-[11px] text-white font-semibold">Aktif</Badge>
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
            <h1 className="text-2xl font-bold text-foreground">ProofyLink — Laporan Analisis Karier &amp; ATS</h1>
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

          {/* ─── PILAR 1: OPTIMASI ATS ─── */}
          {result.focus === "ats" && (
            <div className="space-y-6">
              {/* Card Predikat Kesiapan ATS (Kualitatif, Tanpa Angka Skor) */}
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50/80 border-b pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="size-5 text-[#7C3AED]" />
                      <CardTitle className="text-lg text-foreground">Evaluasi Kesiapan ATS</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Predikat Kesiapan:</span>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          atsData.readinessLevel === "Sangat Siap ATS"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : atsData.readinessLevel === "Cukup Siap"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-blue-50 text-blue-800 border-blue-300"
                        }`}
                      >
                        <span className="size-2 rounded-full bg-current" />
                        {atsData.readinessLevel}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <p className="text-sm leading-relaxed text-slate-700">
                    {result.summary}
                  </p>

                  {/* Kata Kunci Terdeteksi vs Perlu Ditambahkan */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" /> Kata Kunci Utama Terdeteksi:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsData.detectedKeywords.map((kw, i) => (
                          <span key={i} className="inline-block bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                        <Sparkles className="size-4 text-[#7C3AED]" /> Kata Kunci yang Disarankan Ditambahkan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {atsData.missingKeywords.map((kw, i) => (
                          <span key={i} className="inline-block bg-white border border-purple-200 text-[#7C3AED] text-xs font-medium px-2.5 py-1 rounded-lg shadow-2xs">
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Audit Format ATS */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Pemeriksaan Format Keterbacaan ATS:</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {atsData.formatChecks.map((check, i) => (
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

                  {/* Audit per Bagian Profil */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit per Bagian Profil:</h4>
                    <div className="space-y-3">
                      {atsData.sectionAudits.map((sec, i) => (
                        <div key={i} className="rounded-xl border p-4 bg-white space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <strong className="text-sm font-bold text-foreground">{sec.section}</strong>
                            <Badge variant="outline" className={sec.status === "good" ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]" : "bg-amber-50 text-amber-800 border-amber-200 text-[11px]"}>
                              {sec.status === "good" ? "Sudah Baik" : "Perlu Penguatan"}
                            </Badge>
                          </div>
                          <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                            {sec.notes.map((n, ni) => (
                              <li key={ni}>{n}</li>
                            ))}
                          </ul>
                          <p className="text-xs bg-slate-50 p-2.5 rounded-lg border text-slate-700">
                            <strong>Saran:</strong> {sec.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── PILAR 2: CRAFTING HEADLINE ─── */}
          {result.focus === "headline" && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-purple-50/50 border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="size-5 text-[#7C3AED]" />
                    <CardTitle className="text-lg text-foreground">Rekomendasi Headline Profesional</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rumus Baku: <code className="bg-white border px-1.5 py-0.5 rounded text-[#7C3AED] font-mono">{headlineData.formula}</code>
                  </p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    {headlineData.options.map((opt, i) => (
                      <div key={i} className="rounded-2xl border p-4.5 bg-white hover:border-purple-300 transition-colors shadow-2xs space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-purple-100 text-[#7C3AED] border border-purple-200 text-xs font-semibold">
                            {opt.tag}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(opt.headline, `Headline ${i + 1}`)}
                              className="h-8 text-xs gap-1.5 border-slate-300 hover:bg-slate-50"
                            >
                              {copiedText === opt.headline ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                              {copiedText === opt.headline ? "Tersalin" : "Salin"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void handleApplyHeadline(opt.headline)}
                              className="h-8 text-xs gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold shadow-2xs"
                            >
                              <Sparkles className="size-3" /> Gunakan Headline Ini
                            </Button>
                          </div>
                        </div>
                        <p className="text-base font-bold text-foreground leading-snug">{opt.headline}</p>
                        <p className="text-xs text-muted-foreground">{opt.rationale}</p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {opt.keywords.map((kw, ki) => (
                            <span key={ki} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tips Headline */}
                  <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-1.5">
                      <Lightbulb className="size-4 text-amber-500" /> Tips Penulisan Headline ATS-Friendly:
                    </span>
                    <ul className="text-xs space-y-1.5 text-slate-700 list-disc pl-4">
                      {headlineData.tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── PILAR 3: POLES PENCAPAIAN (METODE STAR) ─── */}
          {result.focus === "star" && (
            <div className="space-y-6">
              <Card className="border-border shadow-xs overflow-hidden">
                <CardHeader className="bg-slate-50 border-b pb-4">
                  <div className="flex items-center gap-2.5">
                    <Target className="size-5 text-[#7C3AED]" />
                    <CardTitle className="text-lg text-foreground">Poles Pencapaian Kerja (Metode STAR)</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {starData.frameworkExplanation}
                  </p>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    {starData.bullets.map((bullet, i) => (
                      <div key={i} className="rounded-2xl border p-4.5 bg-white shadow-2xs space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl bg-red-50/50 p-3.5 text-xs border border-red-200/70 space-y-1">
                            <span className="font-bold text-red-700 block">Sebelum (Uraian Tugas Pasif):</span>
                            <p className="text-red-900 leading-relaxed">{bullet.before}</p>
                          </div>

                          <div className="rounded-xl bg-emerald-50/60 p-3.5 text-xs border border-emerald-300/70 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-800">Sesudah (Format STAR Terukur):</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopy(bullet.after, `Pencapaian STAR ${i + 1}`)}
                                className="h-6 px-2 text-[11px] text-emerald-800 hover:bg-emerald-100 font-semibold"
                              >
                                {copiedText === bullet.after ? <Check className="size-3 mr-1 text-emerald-700" /> : <Copy className="size-3 mr-1" />}
                                {copiedText === bullet.after ? "Tersalin" : "Salin"}
                              </Button>
                            </div>
                            <p className="text-emerald-950 font-medium leading-relaxed">{bullet.after}</p>
                            {bullet.metricsHighlight && (
                              <span className="inline-block bg-white text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                🎯 {bullet.metricsHighlight}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 italic bg-slate-50 p-2.5 rounded-lg border">
                          <Lightbulb className="size-3.5 text-amber-500 shrink-0" />
                          <span><strong>Analisis Dampak:</strong> {bullet.impactReason}</span>
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Strong Action Verbs Recommended */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Kata Kerja Aksi Kuat yang Direkomendasikan:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {starData.actionVerbs.map((v, i) => (
                        <span key={i} className="bg-white border text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Executive Summary & Action Steps ─── */}
          <Card className="no-print border-purple-200 bg-gradient-to-r from-purple-50/50 via-white to-purple-50/20 shadow-xs">
            <CardHeader className="pb-3 border-b bg-white/60">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Zap className="size-4.5 text-[#7C3AED]" /> Saran Ringkas &amp; Rencana Aksi
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
                  Gunakan rekomendasi di atas untuk menyempurnakan profil dan CV kamu.
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
