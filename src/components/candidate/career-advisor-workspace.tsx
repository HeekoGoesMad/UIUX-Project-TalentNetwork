"use client";

import { useState } from "react";
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
  Layers,
  Lightbulb,
  Map,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/providers/app-provider";

type FocusType = "ats" | "headline" | "star" | "role";

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

interface AtsDetails {
  score: number;
  detectedKeywords: string[];
  missingKeywords: string[];
  sectionAudits: SectionAudit[];
  formatChecks: FormatCheck[];
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

interface StarBullet {
  before: string;
  after: string;
  impactReason: string;
  metricsHighlight?: string;
}

interface StarDetails {
  frameworkExplanation: string;
  bullets: StarBullet[];
  actionVerbs: string[];
}

interface CoreCompetency {
  competency: string;
  candidateLevel: string;
  requiredLevel: string;
  status: "match" | "gap" | "exceeds";
}

interface RoleDetails {
  targetRole: string;
  matchScore: number;
  matchLevel: string;
  coreCompetencies: CoreCompetency[];
  criticalGaps: string[];
  strategicRecommendations: string[];
}

interface AdvisorResult {
  focus: FocusType | "general";
  summary: string;
  headlineSuggestions: string[];
  starBullets: StarBullet[];
  atsDetails?: AtsDetails;
  headlineDetails?: HeadlineDetails;
  starDetails?: StarDetails;
  roleDetails?: RoleDetails;
  answer: string;
  nextSteps: string[];
  limitations: string[];
  modelVersion: string;
  source: "mock" | "azure" | "local";
}

const focusPresets: { id: FocusType; label: string; icon: typeof Sparkles; desc: string }[] = [
  {
    id: "ats",
    label: "Optimasi ATS",
    icon: FileCheck,
    desc: "Keyword & keterbacaan algoritma parser rekrutmen.",
  },
  {
    id: "headline",
    label: "Crafting Headline",
    icon: Sparkles,
    desc: "1 kalimat bernilai tinggi dengan formula 3-bagian.",
  },
  {
    id: "star",
    label: "STAR Outcome Bullets",
    icon: Target,
    desc: "Ubah tugas pasif jadi pencapaian dengan metrik angka.",
  },
  {
    id: "role",
    label: "Role Alignment",
    icon: Compass,
    desc: "Kesesuaian kualifikasi & gap dengan role impian.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. Dedicated ATS Optimization View
// ─────────────────────────────────────────────────────────────────────────────
function AtsOptimizationView({
  details,
  onCopy,
}: {
  details: AtsDetails;
  onCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* ATS Score & Keyword Health Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Skor Keterbacaan ATS
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#0f2040]">{details.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#19a974] transition-all duration-700"
                style={{ width: `${details.score}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-emerald-900 font-medium">
              {details.score >= 80 ? "✅ Siap dipindai sistem rekrutmen" : "⚠️ Perlu penambahan keyword"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border sm:col-span-2">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-bold text-[#0f2040] flex items-center gap-1.5">
              <Sparkles className="size-4 text-[#19a974]" /> Matriks Kata Kunci (Keywords Analysis)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-4 text-xs">
            <div>
              <span className="font-semibold text-emerald-800 block mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Kata Kunci Terdeteksi ({details.detectedKeywords.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {details.detectedKeywords.map((kw, i) => (
                  <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <span className="font-semibold text-amber-800 block mb-1.5 flex items-center gap-1">
                <AlertTriangle className="size-3.5 text-amber-600" /> Kata Kunci Prioritas yang Perlu Ditambahkan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {details.missingKeywords.map((kw, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onCopy(kw, `Kata Kunci "${kw}"`)}
                    className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    <span>+ {kw}</span>
                    <Copy className="size-2.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section-by-Section ATS Audit */}
      <div>
        <h3 className="text-base font-bold text-[#0f2040] mb-3 flex items-center gap-2">
          <FileCheck className="size-5 text-[#19a974]" /> Audit Format Seksi per Seksi Profil
        </h3>
        <div className="grid gap-3.5 md:grid-cols-2">
          {details.sectionAudits.map((item, idx) => {
            const isGood = item.status === "good";
            return (
              <Card key={idx} className="border-border overflow-hidden">
                <CardHeader className="py-3 px-4 bg-muted/40 border-b flex flex-row items-center justify-between">
                  <span className="font-bold text-sm text-[#0f2040]">{item.section}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-bold ${
                      isGood ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"
                    }`}
                  >
                    {isGood ? "Kondisi Baik" : "Perlu Diperbaiki"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Temuan:</span>
                    <ul className="space-y-1">
                      {item.notes.map((n, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[#0f2040]">
                          <span className={`mt-1 size-1.5 rounded-full shrink-0 ${isGood ? "bg-emerald-500" : "bg-amber-500"}`} />
                          <span>{n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md bg-muted/60 p-2.5 border-l-2 border-[#19a974] text-[#0f2040]">
                    <strong className="block text-[10px] uppercase text-[#08744f]">Rekomendasi Aksi:</strong>
                    <p className="mt-0.5 leading-relaxed">{item.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Format & ATS Compliance Checklist */}
      <Card className="border-border">
        <CardHeader className="py-3.5 px-5 border-b bg-[#f0f6fd]">
          <CardTitle className="text-sm font-bold text-[#0f2040] flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#19a974]" /> Checklist Standar Keterbacaan Parser ATS
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y text-xs">
          {details.formatChecks.map((chk, i) => (
            <div key={i} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
              {chk.passed ? (
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className={`font-semibold ${chk.passed ? "text-[#0f2040]" : "text-amber-900"}`}>
                  {chk.check}
                </span>
                <p className="text-muted-foreground mt-0.5">{chk.tip}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] ${chk.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {chk.passed ? "Sesuai" : "Perlu Dicek"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dedicated Headline Crafting View
// ─────────────────────────────────────────────────────────────────────────────
function HeadlineCraftingView({
  details,
  onCopy,
  copiedText,
}: {
  details: HeadlineDetails;
  onCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* 3-Part Formula Banner */}
      <Card className="border-[#19a974]/30 bg-gradient-to-r from-[#f0fdf9] via-white to-[#f0f6fd]">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#19a974]" />
            <span className="font-bold text-sm text-[#08744f] uppercase tracking-wider">
              Formula Headline Berbobot 3-Bagian:
            </span>
          </div>
          <div className="rounded-lg bg-white p-3 border font-mono text-xs text-[#0f2040] shadow-2xs">
            {details.formula}
          </div>
          <p className="text-xs text-muted-foreground">
            Headline adalah hal pertama yang dilihat recruiter dalam 3 detik. Gunakan formula ini agar langsung menyampaikan peran, spesialisasi, dan dampak terukurmu.
          </p>
        </CardContent>
      </Card>

      {/* Suggested Headline Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#0f2040] flex items-center gap-2">
          <Zap className="size-5 text-[#19a974]" /> 3 Pilihan Headline Siap Pakai
        </h3>

        {details.options.map((opt, idx) => (
          <Card key={idx} className="border-border hover:border-[#19a974]/60 transition-all shadow-2xs">
            <CardHeader className="py-3 px-5 bg-[#f0f6fd] border-b flex flex-row items-center justify-between">
              <Badge className="bg-[#0f2040] text-white text-[11px] font-semibold">{opt.tag}</Badge>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCopy(opt.headline, `Headline Opsi ${idx + 1}`)}
                className="h-7 px-2.5 text-xs text-[#08744f] hover:bg-[#e6f7f0] gap-1.5"
              >
                {copiedText === opt.headline ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedText === opt.headline ? "Tersalin!" : "Salin Headline"}
              </Button>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-bold text-[#0f2040] leading-snug">
                &ldquo;{opt.headline}&rdquo;
              </p>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <span>{opt.rationale}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t text-[11px]">
                <span className="text-muted-foreground font-semibold">Keywords ATS:</span>
                {opt.keywords.map((k, kIdx) => (
                  <Badge key={kIdx} variant="secondary" className="text-[10px]">
                    {k}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Best Practice Tips */}
      <Card className="border-border">
        <CardHeader className="py-3.5 px-5 border-b bg-muted/40">
          <CardTitle className="text-sm font-bold text-[#0f2040] flex items-center gap-2">
            <Check className="size-4 text-[#19a974]" /> Tips Praktis Menulis Headline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-2 text-xs text-[#0f2040]">
            {details.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#19a974] text-[9px] font-bold text-white mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dedicated STAR Outcome Bullets View
// ─────────────────────────────────────────────────────────────────────────────
function StarOutcomeView({
  details,
  onCopy,
  copiedText,
}: {
  details: StarDetails;
  onCopy: (text: string, label: string) => void;
  copiedText: string | null;
}) {
  return (
    <div className="space-y-6">
      {/* STAR Guide Explainer Banner */}
      <Card className="border-[#19a974]/30 bg-gradient-to-r from-[#f0fdf9] via-white to-[#f0f6fd]">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-[#19a974]" />
            <span className="font-bold text-sm text-[#08744f]">Panduan Format STAR (Situation, Task, Action, Result)</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{details.frameworkExplanation}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-semibold">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-blue-900">
              <span className="block font-bold">S — Situation</span>
              <span className="text-[10px] text-muted-foreground">Konteks / Masalah</span>
            </div>
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-2 text-violet-900">
              <span className="block font-bold">T — Task</span>
              <span className="text-[10px] text-muted-foreground">Tanggung Jawab</span>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-emerald-900">
              <span className="block font-bold">A — Action</span>
              <span className="text-[10px] text-muted-foreground">Aksi Nyata & Solusi</span>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-900">
              <span className="block font-bold">R — Result</span>
              <span className="text-[10px] text-muted-foreground">Dampak Angka Metrik</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before & After Comparison Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#0f2040] flex items-center gap-2">
          <TrendingUp className="size-5 text-[#19a974]" /> Transformasi Poin Pengalaman Kerja
        </h3>

        {details.bullets.map((b, idx) => (
          <Card key={idx} className="border-border overflow-hidden shadow-2xs">
            <CardHeader className="py-2.5 px-5 bg-muted/40 border-b flex flex-row items-center justify-between">
              <span className="text-xs font-bold text-[#0f2040]">Contoh Transformasi #{idx + 1}</span>
              {b.metricsHighlight && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px] font-mono font-semibold">
                  {b.metricsHighlight}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid gap-3.5 md:grid-cols-2">
                <div className="rounded-xl bg-red-50/70 p-3.5 text-xs border border-red-200 space-y-1">
                  <span className="font-bold text-red-800 flex items-center gap-1">
                    <XCircle className="size-3.5 text-red-600" /> Sebelum (Tugas Pasif / Deskriptif):
                  </span>
                  <p className="text-red-950 leading-relaxed pl-5">&ldquo;{b.before}&rdquo;</p>
                </div>

                <div className="rounded-xl bg-emerald-50/70 p-3.5 text-xs border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-600" /> Sesudah (STAR + Metrik Konkret):
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onCopy(b.after, "Bullet Point STAR")}
                      className="h-6 px-2 text-[11px] text-[#08744f] hover:bg-emerald-100 gap-1"
                    >
                      {copiedText === b.after ? <Check className="size-3" /> : <Copy className="size-3" />}
                      {copiedText === b.after ? "Tersalin" : "Salin Bullet"}
                    </Button>
                  </div>
                  <p className="text-emerald-950 font-medium leading-relaxed pl-5">&ldquo;{b.after}&rdquo;</p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground border-l-2 border-amber-400">
                <Lightbulb className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#0f2040]">Nilai Tambah untuk HR:</strong> {b.impactReason}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommended Action Verbs */}
      <Card className="border-border">
        <CardHeader className="py-3 px-5 border-b bg-muted/40">
          <CardTitle className="text-sm font-bold text-[#0f2040] flex items-center gap-2">
            <Zap className="size-4 text-[#19a974]" /> Action Verbs Kuat yang Disarankan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {details.actionVerbs.map((verb, i) => (
              <Badge key={i} variant="outline" className="bg-white border-[#0f2040]/20 text-[#0f2040] text-xs font-semibold py-1 px-2.5">
                {verb}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Dedicated Role Alignment View
// ─────────────────────────────────────────────────────────────────────────────
function RoleAlignmentView({ details }: { details: RoleDetails }) {
  return (
    <div className="space-y-6">
      {/* Role Fit Scorecard */}
      <Card className="border-border bg-gradient-to-r from-[#f0f6fd] to-white">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Target Role Dituju:
              </span>
              <h3 className="text-xl font-bold text-[#0f2040] mt-0.5">{details.targetRole}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tingkat Kesiapan Profil: <strong className="text-emerald-700 font-semibold">{details.matchLevel}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border shadow-2xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Match Score</span>
                <span className="text-2xl font-bold font-mono text-[#0f2040]">{details.matchScore}%</span>
              </div>
              <div className="h-10 w-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Competencies Matrix */}
      <div>
        <h3 className="text-base font-bold text-[#0f2040] mb-3 flex items-center gap-2">
          <Layers className="size-5 text-[#19a974]" /> Matriks Penilaian Kompetensi Kunci
        </h3>
        <Card className="border-border overflow-hidden">
          <div className="divide-y text-xs">
            {details.coreCompetencies.map((comp, idx) => {
              const isMatch = comp.status === "match" || comp.status === "exceeds";
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-[#0f2040] block">{comp.competency}</span>
                    <span className="text-muted-foreground text-[11px]">
                      Profil Kamu: <strong>{comp.candidateLevel}</strong> · Standar Role: <strong>{comp.requiredLevel}</strong>
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs font-semibold ${
                      comp.status === "exceeds"
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : isMatch
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {comp.status === "exceeds"
                      ? "⭐ Melebihi Ekspektasi"
                      : isMatch
                      ? "✅ Sesuai Standar"
                      : "⚠️ Area Gap"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Critical Gaps to Bridge */}
      <Card className="border-amber-200 bg-amber-50/40">
        <CardHeader className="py-3 px-5 border-b border-amber-200 bg-amber-50">
          <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" /> Gap Prioritas yang Perlu Dijembatani
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-2.5 text-xs text-amber-950">
            {details.criticalGaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{gap}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Strategic Positioning Recommendations */}
      <Card className="border-border">
        <CardHeader className="py-3 px-5 border-b bg-[#f0f6fd]">
          <CardTitle className="text-sm font-bold text-[#0f2040] flex items-center gap-2">
            <Compass className="size-4 text-[#19a974]" /> Rekomendasi Reposisi Profil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <ul className="space-y-2 text-xs text-[#0f2040]">
            {details.strategicRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Workspace Component
// ─────────────────────────────────────────────────────────────────────────────
export function CareerAdvisorWorkspace() {
  const { cvProfile } = useApp();
  const [selectedFocus, setSelectedFocus] = useState<FocusType>("ats");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const headline = cvProfile?.headline || "Senior Product Designer";
  const targetRole = cvProfile?.targetRole || "Product Designer";
  const skills = cvProfile?.skills || ["Product Design", "UX Research", "Design Systems", "Figma"];

  async function runAdvisor() {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/ai/career-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus: selectedFocus,
          headline,
          about: cvProfile?.about || "Product designer yang fokus pada user research dan design system.",
          targetRole,
          skills,
          location: cvProfile?.location || "Jakarta",
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil rekomendasi karier.");
      }

      const data: AdvisorResult = await response.json();
      setResult(data);
      toast.success("Analisis berhasil diperbarui sesuai fokus yang kamu pilih!");
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

  const activeFocusPreset = focusPresets.find((p) => p.id === selectedFocus) || focusPresets[0];

  return (
    <div className="space-y-8">
      {/* Print stylesheet */}
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

      {/* ─── Profile Summary Header ─── */}
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0f2040]">Pilih Fokus Pengembangan Profil</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih satu aspek yang ingin kamu pertajam hari ini. Sistem akan menghasilkan analisis mendalam khusus topik tersebut:
            </p>
          </div>
        </div>

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
                  <h3 className="mt-3 font-semibold text-[#0f2040] text-sm">{preset.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{preset.desc}</p>
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
                <Bot className="size-5 animate-spin" /> Menganalisis {activeFocusPreset.label}...
              </>
            ) : (
              <>
                <Sparkles className="size-5 text-[#19a974]" /> Analisis & Hasilkan Rekomendasi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ─── Render Focus-Specific Result ─── */}
      {result && (
        <div id="printable-report" className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          {/* Printable Header */}
          <div className="hidden print:block border-b pb-4 mb-6">
            <h1 className="text-2xl font-bold text-[#0f2040]">ProofyLink — Laporan Analisis Karier</h1>
            <p className="text-sm text-gray-600">
              Kandidat: {cvProfile?.fullName || "Profil"} | Fokus: {activeFocusPreset.label} | Target Role: {targetRole} | Tanggal: {new Date().toLocaleDateString("id-ID")}
            </p>
          </div>

          {/* Action Bar */}
          <div className="no-print flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#19a974]/40 bg-[#f0fdf9] text-[#08744f] gap-1 px-3 py-1">
                <Sparkles className="size-3.5" /> Hasil Analisis: {activeFocusPreset.label}
              </Badge>
            </div>

            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="gap-2 border-[#0f2040]/30 text-[#0f2040] hover:bg-[#f0f6fd]"
            >
              <Download className="size-4 text-[#08744f]" /> Unduh PDF
            </Button>
          </div>

          {/* Executive Summary Card */}
          <Card className="border-[#0f2040]/15 bg-card shadow-sm">
            <CardHeader className="border-b bg-[#f0f6fd] pb-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-[#19a974]" />
                  <CardTitle className="text-base font-bold text-[#0f2040]">
                    Ringkasan Hasil Evaluasi: {activeFocusPreset.label}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="capitalize font-mono text-[11px]">
                  {result.focus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-[#0f2040] leading-relaxed font-medium">
                {result.summary}
              </p>
            </CardContent>
          </Card>

          {/* ─── ONLY Render the User's Chosen Focus Component ─── */}
          {result.focus === "ats" && result.atsDetails && (
            <AtsOptimizationView
              details={result.atsDetails}
              onCopy={handleCopy}
              copiedText={copiedText}
            />
          )}

          {result.focus === "headline" && result.headlineDetails && (
            <HeadlineCraftingView
              details={result.headlineDetails}
              onCopy={handleCopy}
              copiedText={copiedText}
            />
          )}

          {result.focus === "star" && result.starDetails && (
            <StarOutcomeView
              details={result.starDetails}
              onCopy={handleCopy}
              copiedText={copiedText}
            />
          )}

          {result.focus === "role" && result.roleDetails && (
            <RoleAlignmentView details={result.roleDetails} />
          )}

          {/* Actionable Next Steps */}
          <Card className="no-print border-[#19a974]/30 bg-gradient-to-r from-[#f0fdf9] to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-[#08744f] flex items-center gap-2">
                <Check className="size-5 text-[#19a974]" /> Langkah Konkret Selanjutnya
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-xs sm:text-sm text-[#0f2040]">
                {result.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#19a974] text-xs text-white font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t flex flex-wrap gap-2.5">
                <Link href="/candidate/cv">
                  <Button size="sm" className="gap-1.5 bg-[#19a974] hover:bg-[#14875d] text-white">
                    <FileText className="size-3.5" /> Buka CV Workspace
                  </Button>
                </Link>
                <Link href="/candidate/career-gaps">
                  <Button size="sm" variant="outline" className="gap-1.5 border-[#0f2040]/30 text-[#0f2040]">
                    <Compass className="size-3.5" /> Analisis Skill Gap
                  </Button>
                </Link>
                <Link href="/candidate/career-roadmap">
                  <Button size="sm" variant="outline" className="gap-1.5 border-[#0f2040]/30 text-[#0f2040]">
                    <Map className="size-3.5" /> Buka Career Roadmap
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* AI Disclosure & Limitations */}
          <div className="rounded-xl border bg-muted/60 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span className="font-mono uppercase tracking-wider text-[#08744f] font-semibold flex items-center gap-1">
                <Bot className="size-3.5" /> AI Transparency Notice
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span>Source: <strong className="uppercase">{result.source}</strong></span>
                <span>•</span>
                <span>Model: <strong>{result.modelVersion}</strong></span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldAlert className="size-3.5 text-amber-600" /> Catatan Batasan Sistem:
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

