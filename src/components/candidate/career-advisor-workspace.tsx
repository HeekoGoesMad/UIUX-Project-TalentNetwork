"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  FileCheck,
  FileText,
  Lightbulb,
  Map,
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

type FocusType = "ats" | "headline" | "star" | "role";

interface Pillar {
  name: string;
  score: number;
  status: "excellent" | "good" | "needs_improvement";
  recommendation: string;
  actionables: string[];
}

interface StarBullet {
  before: string;
  after: string;
  impactReason: string;
}

interface StructuredAdvice {
  opening: string;
  whatGood: string[];
  whatNotGood: string[];
  conclusion: string;
}

interface AdvisorResult {
  focus: string;
  summary: string;
  headlineSuggestions: string[];
  starBullets: StarBullet[];
  pillars: Pillar[];
  structuredAdvice?: StructuredAdvice;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure";
}

const focusPresets: { id: FocusType; label: string; icon: typeof Sparkles; desc: string }[] = [
  {
    id: "ats",
    label: "Optimasi ATS",
    icon: FileCheck,
    desc: "Pastikan keyword & format profil mudah dibaca recruiter.",
  },
  {
    id: "headline",
    label: "Crafting Headline",
    icon: Sparkles,
    desc: "Susun 1 kalimat pertama yang berbobot & berorientasi peran.",
  },
  {
    id: "star",
    label: "STAR Outcome Bullets",
    icon: Target,
    desc: "Ubah daftar tugas biasa menjadi pencapaian terukur dengan angka.",
  },
  {
    id: "role",
    label: "Role Alignment",
    icon: Compass,
    desc: "Posisikan profil agar seimbang dengan kualifikasi role impian.",
  },
];

export function CareerAdvisorWorkspace() {
  const { cvProfile } = useApp();
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

  // Simulated progressive typewriter / streaming effect
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
      }, 40);

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
      toast.success("Rekomendasi profil karier berhasil dihasilkan!");
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

  function handleDownloadPdf() {
    window.print();
  }

  // Helper fallback for structured advice if backend payload is legacy
  const adviceData: StructuredAdvice = result?.structuredAdvice || {
    opening: `Berdasarkan analisis profil ${targetRole}, berikut ringkasan evaluasi kesiapan kariermu:`,
    whatGood: [
      `Fokus spesialisasi pada ${skills.slice(0, 2).join(" & ") || "bidang utama"} sudah terlihat jelas.`,
      `Pengalaman kerja relevan mendukung klaim kompetensi.`,
    ],
    whatNotGood: [
      `Poin pengalaman kerja belum sepenuhnya menggunakan angka metrik (STAR Method).`,
      `Keyword ATS utama belum tersebar merata di bagian headline dan deskripsi.`,
    ],
    conclusion: `Perbarui headline dan tambahkan angka pencapaian terukur untuk meningkatkan visibilitas profil hingga 2x lipat.`,
  };

  return (
    <div className="space-y-8">
      {/* Printable styles for PDF download */}
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
      <Card className="no-print border-[#19a974]/20 bg-gradient-to-r from-[#f0f6fd] via-white to-[#f0fdf9]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#0f2040] text-white">
                <User className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-[#0f2040]">
                    {cvProfile?.fullName || "Profil kamu"}
                  </h2>
                  <Badge variant="outline" className="border-[#19a974]/40 bg-[#e6f7f0] text-[#08744f]">
                    Ready to Improve
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-[#0f2040]">{headline}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Target Role: <span className="font-semibold text-foreground">{targetRole}</span> • {skills.length} Skill Terdaftar
                </p>
              </div>
            </div>

            <Link href="/candidate/cv">
              <Button variant="outline" size="sm" className="gap-2 border-[#19a974] text-[#08744f] hover:bg-[#e6f7f0]">
                <FileText className="size-4" /> Edit CV Workspace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* ─── Focus Area Presets Selection ─── */}
      <div className="no-print">
        <h2 className="text-lg font-semibold text-[#0f2040]">Pilih Fokus Pengembangan Profil</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih aspek yang ingin kamu pertajam hari ini untuk mendapatkan rekomendasi spesifik:
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {focusPresets.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedFocus === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedFocus(preset.id)}
                className={`card-interactive flex flex-col justify-between rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-[#19a974] bg-[#f0fdf9] ring-2 ring-[#19a974]/30 shadow-sm"
                    : "border-border bg-card hover:border-[#19a974]/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        isSelected ? "bg-[#19a974] text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>
                    {isSelected && (
                      <Badge className="bg-[#19a974] text-xs text-white">Aktif</Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-[#0f2040]">{preset.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{preset.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => void runAdvisor()}
            disabled={loading}
            size="lg"
            className="gap-2 bg-[#0f2040] font-semibold text-white shadow-md hover:bg-[#1a3460]"
          >
            {loading ? (
              <>
                <Bot className="size-5 animate-spin" /> Menganalisis Profil...
              </>
            ) : (
              <>
                <Sparkles className="size-5 text-[#19a974]" /> Analisis & Hasilkan Rekomendasi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Advice Results & Printable Region ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-fade-up">
          {/* Printable Header Title */}
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-[#0f2040]">ProofyLink — Laporan Analisis Karier & ATS</h1>
            <p className="text-sm text-gray-600">
              Kandidat: {cvProfile?.fullName || "Profil kamu"} | Target Role: {targetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          {/* Action Bar with Download PDF Button */}
          <div className="no-print flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#19a974]/40 bg-[#f0fdf9] text-[#08744f] gap-1 px-3 py-1">
                <Sparkles className="size-3.5" /> Result Analysis Ready
              </Badge>
              {isStreaming && (
                <span className="flex items-center gap-1.5 text-xs text-[#08744f] font-mono animate-pulse">
                  <span className="inline-block size-2 rounded-full bg-[#19a974]" /> Generating live... ({streamProgress}%)
                </span>
              )}
            </div>

            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="gap-2 border-[#0f2040]/30 text-[#0f2040] hover:bg-[#f0f6fd]"
            >
              <Download className="size-4 text-[#08744f]" /> Unduh PDF Analysis
            </Button>
          </div>

          {/* Executive Summary Card with Reformatted "Saran Utama AI" */}
          <Card className="border-[#0f2040]/15 bg-card shadow-sm">
            <CardHeader className="border-b bg-[#f0f6fd] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-[#19a974]" />
                  <CardTitle className="text-xl text-[#0f2040]">Ringkasan Rekomendasi Karier</CardTitle>
                </div>
                <Badge variant="secondary" className="capitalize font-mono">
                  Fokus: {result.focus}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Highlight summary statement */}
              <p className="text-base font-semibold text-[#0f2040] leading-relaxed">
                {result.summary}
                {isStreaming && <span className="inline-block w-1.5 h-4 ml-1 bg-[#19a974] animate-ping" />}
              </p>

              {/* ── Reformatted Saran Utama AI Container ── */}
              <div className="rounded-xl border border-[#19a974]/30 bg-[#f0fdf9] p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[#19a974]/20 pb-3">
                  <span className="font-bold text-[#08744f] flex items-center gap-2 text-base">
                    <Sparkles className="size-5 text-[#19a974]" /> Saran Utama AI & Analisis Kualitatif
                  </span>
                  <Badge className="bg-[#19a974] text-xs text-white">AI Structured Insights</Badge>
                </div>

                {/* 1. Opening sentence */}
                <p className="text-sm font-medium text-[#0f2040] leading-relaxed bg-white/70 p-3 rounded-lg border border-[#19a974]/15">
                  {adviceData.opening}
                </p>

                {/* 2. What's Good List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-600" /> Hal yang Sudah Baik dalam Profil:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-emerald-950 pl-1">
                    {adviceData.whatGood.map((good, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-emerald-50/70 p-2 rounded-md border border-emerald-100">
                        <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{good}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. What Needs Improvement List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-amber-600" /> Area yang Perlu Perbaikan & Ditingkatkan:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-950 pl-1">
                    {adviceData.whatNotGood.map((bad, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-amber-50/70 p-2 rounded-md border border-amber-200">
                        <AlertTriangle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{bad}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 4. Conclusion & Strategy */}
                <div className="rounded-lg bg-[#0f2040] p-4 text-xs text-white space-y-1 shadow-xs">
                  <span className="font-bold text-[#7aaee0] uppercase tracking-wider block text-[11px]">
                    Kesimpulan & Langkah Eksekusi:
                  </span>
                  <p className="leading-relaxed">{adviceData.conclusion}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5-Pillar Scorecard Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#0f2040] flex items-center gap-2">
                <TrendingUp className="size-5 text-[#19a974]" /> Evaluasi 5 Pilar Kesiapan Profil
              </h2>
              <span className="text-xs text-muted-foreground">Standardized HR & ATS Benchmark</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.pillars.map((pillar, idx) => {
                const statusColor =
                  pillar.status === "excellent"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : pillar.status === "good"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-amber-100 text-amber-800 border-amber-300";

                return (
                  <Card key={idx} className="card-interactive flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs capitalize ${statusColor}`}>
                          {pillar.status.replace("_", " ")}
                        </Badge>
                        <span className="font-mono text-sm font-bold text-[#0f2040]">
                          {pillar.score}/100
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold text-[#0f2040] mt-2">
                        {pillar.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      <p className="text-muted-foreground leading-relaxed">{pillar.recommendation}</p>
                      <div className="space-y-1 border-t pt-2">
                        <span className="font-semibold text-[#0f2040]">Aksi Disarankan:</span>
                        <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                          {pillar.actionables.map((act, aIdx) => (
                            <li key={aIdx}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Headline Recommendations */}
          {result.headlineSuggestions.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#0f2040] flex items-center gap-2">
                  <Sparkles className="size-5 text-[#19a974]" /> Usulan Headline Berdampak Tinggi
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Klik salin untuk memperbarui headline profesionalmu di CV Workspace.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.headlineSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border bg-[#f0f6fd] p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-[#0f2040]">{item}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(item, `Headline ${idx + 1}`)}
                      className="no-print shrink-0 gap-1.5 text-xs text-[#08744f] hover:bg-[#e6f7f0]"
                    >
                      {copiedText === item ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copiedText === item ? "Tersalin" : "Salin Headline"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* STAR Bullet Point Transformations */}
          {result.starBullets.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[#0f2040] flex items-center gap-2">
                  <Target className="size-5 text-[#19a974]" /> Transformasi Bullet Pengalaman (STAR Method)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Bandingkan kalimat umum dengan format STAR yang menonjolkan dampak kuantitatif.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.starBullets.map((bullet, idx) => (
                  <div key={idx} className="rounded-xl border p-4 space-y-3 bg-card">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-red-50/60 p-3 text-xs border border-red-100">
                        <span className="font-semibold text-red-700 block mb-1">Sebelum (Format Deskriptif Biasa):</span>
                        <p className="text-red-900">{bullet.before}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50/60 p-3 text-xs border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-emerald-800">Sesudah (Format STAR Outcome):</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(bullet.after, "Bullet Point STAR")}
                            className="no-print h-6 px-2 text-[11px] text-[#08744f] hover:bg-emerald-100"
                          >
                            <Copy className="size-3 mr-1" /> Salin Bullet
                          </Button>
                        </div>
                        <p className="text-emerald-950 font-medium">{bullet.after}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 italic">
                      <Lightbulb className="size-3.5 text-amber-600 shrink-0" /> {bullet.impactReason}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actionable Next Steps & Sister Tools Navigation */}
          <Card className="no-print border-[#19a974]/30 bg-gradient-to-r from-[#f0fdf9] to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-[#08744f] flex items-center gap-2">
                <Check className="size-5 text-[#19a974]" /> Langkah Konkret Selanjutnya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-[#0f2040]">
                {result.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#19a974] text-xs text-white font-bold">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t flex flex-wrap gap-3">
                <Link href="/candidate/cv">
                  <Button className="gap-2 bg-[#19a974] hover:bg-[#14875d] text-white">
                    <FileText className="size-4" /> Buka CV Workspace
                  </Button>
                </Link>
                <Link href="/candidate/career-gaps">
                  <Button variant="outline" className="gap-2 border-[#0f2040]/30 text-[#0f2040]">
                    <Compass className="size-4" /> Analisis Skill Gap
                  </Button>
                </Link>
                <Link href="/candidate/career-roadmap">
                  <Button variant="outline" className="gap-2 border-[#0f2040]/30 text-[#0f2040]">
                    <Map className="size-4" /> Buka Career Roadmap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Disclosure & Limitations Footer (DESIGN.md Compliant) */}
          <div className="rounded-xl border bg-muted/60 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-mono uppercase tracking-wider text-[#08744f] font-semibold flex items-center gap-1">
                <Bot className="size-3.5" /> AI Draft Notice
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Source: <strong className="uppercase">{result.source}</strong></span>
                <span>•</span>
                <span>Model: <strong>{result.modelVersion}</strong></span>
                <span>•</span>
                <span>Coverage: <strong>Profile Context</strong></span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldAlert className="size-3.5 text-amber-600" /> Batasan Sistem:
              </span>
              <ul className="list-disc pl-4 space-y-0.5">
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
