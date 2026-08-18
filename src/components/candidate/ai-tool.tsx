"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Layers,
  Lightbulb,
  Map,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import { CandidateAiNav } from "@/components/candidate/candidate-ai-nav";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GapResult {
  missing: string[];
  unevidenced: string[];
  transferable: string[];
  irrelevant: string[];
  limitations: string[];
  modelVersion: string;
  source: string;
}

interface RoadmapPhase {
  title: string;
  outcome: string;
  actions: string[];
}

interface RoadmapResult {
  phases: RoadmapPhase[];
  limitations: string[];
  modelVersion: string;
  source: string;
}

type AiResult = GapResult | RoadmapResult | Record<string, unknown>;

function isGapResult(r: AiResult): r is GapResult {
  return Array.isArray((r as GapResult).missing);
}
function isRoadmapResult(r: AiResult): r is RoadmapResult {
  return Array.isArray((r as RoadmapResult).phases);
}

// ─── Shared footer ────────────────────────────────────────────────────────────
function AiDisclosure({ limitations, source, modelVersion }: { limitations: string[]; source: string; modelVersion: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="space-y-1">
        <span className="block font-semibold">Catatan AI — Baca sebelum mengambil keputusan:</span>
        <ul className="list-disc pl-4 space-y-0.5">
          {limitations.map((lim, i) => <li key={i}>{lim}</li>)}
        </ul>
        <p className="mt-1.5 text-[11px] text-amber-700/70">
          Source: <strong>{source}</strong> · Model: <strong>{modelVersion}</strong>
        </p>
      </div>
    </div>
  );
}

// ─── Gap Analysis Renderer ────────────────────────────────────────────────────
const GAP_SECTIONS = [
  {
    key: "missing" as const,
    label: "Skill / Bukti yang Belum Ada",
    desc: "Komponen yang sama sekali tidak ditemukan dalam profilmu saat ini.",
    Icon: XCircle,
    cardBg: "bg-red-50", cardBorder: "border-red-200",
    iconCls: "text-red-500", badgeCls: "bg-red-100 text-red-700",
    rowHover: "hover:bg-red-50/60", chevronCls: "text-red-400",
  },
  {
    key: "unevidenced" as const,
    label: "Skill Ada tapi Belum Terbukti",
    desc: "Kamu mencantumkan skill ini, namun belum ada portofolio atau pencapaian nyata yang mendukung.",
    Icon: AlertTriangle,
    cardBg: "bg-amber-50", cardBorder: "border-amber-200",
    iconCls: "text-amber-500", badgeCls: "bg-amber-100 text-amber-700",
    rowHover: "hover:bg-amber-50/60", chevronCls: "text-amber-400",
  },
  {
    key: "transferable" as const,
    label: "Skill Transferable yang Bisa Dimanfaatkan",
    desc: "Kemampuan dari pengalaman lain yang bisa dialihkan dan ditonjolkan untuk role target.",
    Icon: ArrowRight,
    cardBg: "bg-emerald-50", cardBorder: "border-emerald-200",
    iconCls: "text-emerald-600", badgeCls: "bg-emerald-100 text-emerald-700",
    rowHover: "hover:bg-emerald-50/40", chevronCls: "text-emerald-500",
  },
  {
    key: "irrelevant" as const,
    label: "Skill Tidak Relevan untuk Role Target",
    desc: "Pertimbangkan untuk tidak menonjolkan skill ini agar profil lebih fokus.",
    Icon: Layers,
    cardBg: "bg-slate-50", cardBorder: "border-slate-200",
    iconCls: "text-slate-400", badgeCls: "bg-slate-100 text-slate-600",
    rowHover: "hover:bg-slate-50/60", chevronCls: "text-slate-400",
  },
] as const;

function GapResultView({ result }: { result: GapResult }) {
  return (
    <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {GAP_SECTIONS.map((s) => {
        const items = result[s.key];
        if (!items.length) return null;
        return (
          <Card key={s.key} className={`overflow-hidden border ${s.cardBorder}`}>
            <CardHeader className={`${s.cardBg} border-b ${s.cardBorder} px-5 py-4`}>
              <div className="flex items-start gap-3">
                <s.Icon className={`mt-0.5 size-5 shrink-0 ${s.iconCls}`} />
                <div className="flex-1">
                  <CardTitle className="text-sm font-bold text-[#0f2040]">{s.label}</CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
                </div>
                <Badge className={`ml-auto shrink-0 border-0 text-xs font-semibold ${s.badgeCls}`}>
                  {items.length} item
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {items.map((item, i) => (
                  <li key={i} className={`flex items-center gap-3 px-5 py-3 text-sm text-[#0f2040] transition-colors ${s.rowHover}`}>
                    <ChevronRight className={`size-3.5 shrink-0 ${s.chevronCls}`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
      <AiDisclosure limitations={result.limitations} source={result.source} modelVersion={result.modelVersion} />
    </div>
  );
}

// ─── Roadmap Renderer ─────────────────────────────────────────────────────────
const PHASE_STYLES = [
  { num: "bg-[#0f2040] text-white", cardBg: "bg-blue-50", cardBorder: "border-blue-200", badge: "bg-blue-100 text-blue-700", action: "bg-white border-blue-100 text-blue-900" },
  { num: "bg-violet-600 text-white", cardBg: "bg-violet-50", cardBorder: "border-violet-200", badge: "bg-violet-100 text-violet-700", action: "bg-white border-violet-100 text-violet-900" },
  { num: "bg-emerald-600 text-white", cardBg: "bg-emerald-50", cardBorder: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700", action: "bg-white border-emerald-100 text-emerald-900" },
  { num: "bg-amber-500 text-white", cardBg: "bg-amber-50", cardBorder: "border-amber-200", badge: "bg-amber-100 text-amber-700", action: "bg-white border-amber-100 text-amber-900" },
];

function RoadmapResultView({ result }: { result: RoadmapResult }) {
  return (
    <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="space-y-4">
        {result.phases.map((phase, idx) => {
          const s = PHASE_STYLES[idx % PHASE_STYLES.length];
          return (
            <div key={idx} className="relative flex gap-4">
              {idx < result.phases.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-12px] z-0 w-[2px] bg-border" />
              )}
              <div className={`relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${s.num}`}>
                {idx + 1}
              </div>
              <Card className={`flex-1 overflow-hidden border ${s.cardBorder}`}>
                <CardHeader className={`${s.cardBg} border-b ${s.cardBorder} px-5 py-3.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-[#0f2040]">{phase.title}</CardTitle>
                    <Badge className={`border-0 text-[11px] font-medium ${s.badge}`}>Fase {idx + 1}</Badge>
                  </div>
                  <div className="mt-2 flex items-start gap-2">
                    <Target className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-[#0f2040]">Target Outcome: </span>
                      {phase.outcome}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="px-5 py-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aksi Konkret</p>
                  <ul className="space-y-2">
                    {phase.actions.map((action, aIdx) => (
                      <li key={aIdx} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${s.action}`}>
                        <CheckCircle2 className="size-3.5 shrink-0 opacity-50" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      <AiDisclosure limitations={result.limitations} source={result.source} modelVersion={result.modelVersion} />
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export function AiTool({ title, description, endpoint }: { title: string; description: string; endpoint: string }) {
  const { cvProfile } = useApp();
  const [result, setResult] = useState<AiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const isGaps = endpoint.includes("gap-analysis");
  const isRoadmap = endpoint.includes("roadmap");
  const HeroIcon = isGaps ? TrendingUp : isRoadmap ? Map : Lightbulb;

  async function run() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: cvProfile?.headline || "Senior Product Designer",
          about: cvProfile?.about || "Product designer",
          targetRole: cvProfile?.targetRole || "Product Designer",
          skills: cvProfile?.skills || ["Product design", "Research"],
        }),
      });
      setResult((await response.json()) as AiResult);
    } catch {
      setResult({ error: "Gagal memuat hasil AI. Silakan coba lagi." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#08744f]">
        <Sparkles className="size-4" /> AI Workspace
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[#0f2040]">{title}</h1>
      <p className="mt-2 mb-6 text-muted-foreground">{description}</p>

      <CandidateAiNav />

      <Card className="mt-6 border-dashed">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#0f2040]">
            <HeroIcon className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-[#0f2040]">Siap menganalisis profilmu</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isGaps
                ? "Hasil dikelompokkan: Skill Missing, Belum Terbukti, Transferable, dan Tidak Relevan — langsung actionable."
                : isRoadmap
                ? "Hasil berupa fase belajar bertahap dengan target outcome dan aksi konkret per fase."
                : "Hasil analisis AI akan ditampilkan setelah generate."}
            </p>
          </div>
          <Button
            onClick={() => void run()}
            disabled={loading}
            className="shrink-0 gap-2 bg-[#0f2040] text-white hover:bg-[#1a3460]"
          >
            {loading ? (
              <><Bot className="size-4 animate-spin" /> Menganalisis...</>
            ) : (
              <><Sparkles className="size-4 text-[#19a974]" /> Generate Analisis</>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {isGapResult(result) && <GapResultView result={result} />}
          {isRoadmapResult(result) && <RoadmapResultView result={result} />}
          {!isGapResult(result) && !isRoadmapResult(result) && (
            <div className="mt-6 rounded-xl border bg-muted p-5 text-xs">
              <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}

