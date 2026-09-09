/* eslint-disable @next/next/no-img-element */
"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { CandidateAvatar } from "@/components/talent/avatar";
import { CandidateCategoryBadge } from "@/components/talent/candidate-category-badge";
import { CandidateStatusBadge } from "@/components/talent/candidate-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { findCandidate } from "@/data/candidates";
import { maskName } from "@/lib/candidate-display";
import { UUID_RE, cn } from "@/lib/utils";
import { useApp } from "@/providers/app-provider";
import type { AiSummary, Candidate, CandidatePersonality, ScreeningInsight, ScreeningResult } from "@/types";
import {
    AlertCircle,
    ArrowLeft,
    Banknote,
    Bookmark,
    Brain,
    Briefcase,
    Calendar,
    Check,
    CircleHelp,
    Copy,
    ExternalLink,
    FileCheck2,
    FileText,
    Globe,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
    MessageSquareQuote,
    Phone,
    Printer,
    RefreshCw,
    ScanLine,
    ShieldCheck,
    Sparkles,
    UserCheck,
    Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InterviewQuestionModal } from "@/components/recruiter/interview-question-modal";
import { PromptedOutreachComposer } from "@/components/recruiter/prompted-outreach-composer";
import { ScheduleInterviewModal } from "@/components/recruiter/schedule-interview-modal";
import { CreateOfferModal } from "@/components/recruiter/create-offer-modal";
import { AssignToJobModal } from "@/components/recruiter/assign-to-job-modal";

function PersonalityOverview({ personality }: { personality: CandidatePersonality }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            <Brain className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-violet-950 dark:text-violet-100">
                {personality.type} · {personality.label}
              </span>
              <Badge variant="outline" className="border-violet-200 bg-white/60 text-[10px] text-violet-700 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
                16Personalities
              </Badge>
            </div>
            {personality.tagline && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {personality.tagline}
              </p>
            )}
          </div>
        </div>
        {personality.testUrl && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-700 hover:bg-violet-100 hover:text-violet-900 dark:text-violet-300 dark:hover:bg-violet-900/40" asChild>
            <a href={personality.testUrl} target="_blank" rel="noopener noreferrer">
              Hasil Tes <ExternalLink className="ml-1 size-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
import { toast } from "sonner";

const PORTFOLIO_LABELS: Record<string, string> = {
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "linkedin.com": "LinkedIn",
  "behance.net": "Behance",
  "dribbble.com": "Dribbble",
  "medium.com": "Medium",
};

function portfolioLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return PORTFOLIO_LABELS[hostname] ?? hostname;
  } catch {
    return "Portofolio";
  }
}

const CV_PRINT_CSS = `
@media print {
  body * {
    visibility: hidden !important;
  }
  #cv-print-sheet,
  #cv-print-sheet * {
    visibility: visible !important;
  }
  #cv-print-sheet {
    position: absolute !important;
    inset: auto !important;
    top: 0 !important;
    left: 0 !important;
    transform: none !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  #cv-print-sheet > button {
    display: none !important;
  }
  [data-print-hide] {
    display: none !important;
  }
}
@page {
  margin: 14mm;
}
`;

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <Check className="mt-0.5 size-4 shrink-0 text-slate-700" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function ScreeningResults({
  candidateId,
  candidate,
  completed,
  screeningStatus,
  screeningError,
  onRetry,
  result,
  saveResult,
}: {
  candidateId: string;
  candidate: Candidate;
  completed: boolean;
  screeningStatus?: string;
  screeningError?: string | null;
  onRetry?: () => void;
  result?: ScreeningResult;
  saveResult: (candidateId: string, result: ScreeningResult) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">(
    result ? "idle" : completed || screeningStatus === "processing" || screeningStatus === "in_progress" ? "loading" : "idle",
  );
  const [error, setError] = useState("");

  const loadResults = async () => {
    if (!completed || result) return;
    setState("loading");
    setError("");
    try {
       const profile = {
        headline: candidate.role,
        about: candidate.summary,
        skills: candidate.skills,
        targetRole: candidate.role,
        location: candidate.location,
      };
       const isDatabaseCandidate = UUID_RE.test(candidateId);
      if (isDatabaseCandidate) {
        const runResponse = await fetch(`/api/screening-runs?candidateProfileId=${encodeURIComponent(candidateId)}`);
        const runData = (await runResponse.json()) as { run?: { id: string; status: string; score?: { score: number; label: string; coverage: number; evidence: unknown; limitations: unknown; source: "mock" | "azure"; modelVersion: string } | null }; error?: string };
        if (!runResponse.ok) throw new Error(runData.error ?? "Status screening belum dapat dimuat.");
        if (!runData.run || runData.run.status !== "completed") return;
        const resultResponse = await fetch(`/api/screening-runs/${runData.run.id}/result`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skills: candidate.skills }),
        });
        const resultData = (await resultResponse.json()) as { score?: NonNullable<typeof runData.run.score>; aiSummary?: AiSummary; error?: string };
        if (!resultResponse.ok || !resultData.score) throw new Error(resultData.error ?? "Hasil screening belum dapat dimuat.");
        const savedSummary = resultData.aiSummary ?? (await (await fetch("/api/ai/summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) })).json() as AiSummary);
        saveResult(candidateId, {
          insight: {
            score: resultData.score.score,
            label: resultData.score.label,
            coverage: resultData.score.coverage,
            evidence: Array.isArray(resultData.score.evidence) ? resultData.score.evidence.map(String) : [],
            limitations: Array.isArray(resultData.score.limitations) ? resultData.score.limitations.map(String) : [],
            followUp: "Lakukan interview berbasis bukti dan beri kandidat kesempatan klarifikasi.",
            modelVersion: resultData.score.modelVersion,
            source: resultData.score.source,
          },
          summary: savedSummary,
          fetchedAt: new Date().toISOString(),
        });
        setState("idle");
        return;
      }
      const [insightResponse, summaryResponse] = await Promise.all([
        fetch("/api/ai/screening-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent: true, profile }),
        }),
        fetch("/api/ai/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        }),
      ]);
      if (!insightResponse.ok || !summaryResponse.ok)
        throw new Error("Hasil AI belum dapat dimuat. Coba lagi.");
      const insight = (await insightResponse.json()) as ScreeningInsight;
      const summary = (await summaryResponse.json()) as AiSummary;
      saveResult(candidateId, { insight, summary, fetchedAt: new Date().toISOString() });
      setState("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Hasil screening belum dapat dimuat.");
      setState("error");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadResults(), 0);
    return () => window.clearTimeout(timer);
    // The loader is recreated with the profile state; these inputs are the intended reload boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId, candidate, completed, result]);

  return (
    <section className="mt-10 border-t pt-10" aria-labelledby="screening-results-title">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]">
            <ShieldCheck className="size-4" /> Insight Recruiter
          </p>
          <h2 id="screening-results-title" className="mt-2 text-2xl font-bold text-[#111827]">
            Hasil Screening
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
             Insight berbasis role fit dan kualitas data, ditampilkan setelah screening run selesai. Consent tetap disimpan untuk pemeriksaan finansial atau credit di masa depan.
          </p>
        </div>
        {completed && (
          <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-[#7C3AED]">
            <FileCheck2 className="mr-1 size-3" /> Screening selesai
          </Badge>
        )}
      </div>

      {screeningError && !completed ? (
        <Card className="mt-5 border-amber-200 bg-amber-50/50">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div>
              <p className="font-semibold text-amber-950">Profil terbuka, screening belum selesai</p>
              <p className="mt-1 text-sm text-amber-900/80">{screeningError}</p>
            </div>
            {onRetry && <Button variant="outline" onClick={onRetry}><RefreshCw className="mr-2 size-4" /> Coba lagi</Button>}
          </CardContent>
        </Card>
      ) : !completed && (screeningStatus === "processing" || screeningStatus === "in_progress") ? (
        <Card className="mt-5 border-purple-100 bg-purple-50/50">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-5 animate-spin text-[#7C3AED]" /> Screening otomatis sedang berjalan. Menyiapkan skor dan AI Summary...
          </CardContent>
        </Card>
      ) : !completed && (
        <Card className="mt-5 border-dashed bg-muted/30">
          <CardContent className="flex gap-3 p-5">
            <CircleHelp className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold text-[#111827]">Hasil belum tersedia</p>
               <p className="mt-1 text-sm text-muted-foreground">Screening role fit akan dimulai otomatis setelah profil berhasil dibuka.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {completed && state === "loading" && (
        <Card className="mt-5">
          <CardContent className="flex items-center gap-3 p-6 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-5 animate-spin text-[#7C3AED]" /> Menyiapkan hasil screening dan AI Summary...
          </CardContent>
        </Card>
      )}

      {completed && state === "error" && (
        <Card className="mt-5 border-red-200 bg-red-50/50">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-950">Hasil belum berhasil dimuat</p>
                <p className="mt-1 text-sm text-red-900/80">{error}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setState("loading");
                setError("");
                void loadResults();
              }}
            >
              <RefreshCw className="size-4" /> Coba lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {completed && result && (
        <div className="mt-5 space-y-4">
          <Card className="overflow-hidden border-slate-200">
            <CardContent className="grid gap-6 bg-slate-50/50 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="flex size-28 flex-col items-center justify-center rounded-full border-8 border-slate-200 bg-white">
                <span className="font-mono text-4xl font-bold text-[#7C3AED]">{result.insight.score}</span>
                <span className="text-xs text-muted-foreground">dari 100</span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#7C3AED] text-white">{result.insight.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    Rekomendasi berbasis data, bukan keputusan otomatis
                  </span>
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Cakupan data</span>
                    <span className="font-mono text-[#7C3AED]">{result.insight.coverage}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#7C3AED]/20">
                    <div
                      className="h-2 rounded-full bg-[#7C3AED]"
                      style={{ width: `${result.insight.coverage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Seberapa banyak konteks profil yang tersedia untuk insight ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bukti yang terdeteksi</CardTitle>
              </CardHeader>
              <CardContent>
                <List items={result.insight.evidence} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Limitasi</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {result.insight.limitations.map((item) => (
                    <li key={item} className="flex gap-2">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-slate-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5 text-[#7C3AED]" /> AI Summary <Badge variant="outline">AI draft</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-7">{result.summary.summary}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-semibold">Kekuatan yang terlihat</p>
                  <List items={result.summary.strengths} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold">Bukti pendukung</p>
                  <List items={result.summary.evidence} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground">
                <span>Sumber: {result.insight.source}</span>
                <span>Model: {result.insight.modelVersion}</span>
                <span>Diambil: {new Date(result.fetchedAt).toLocaleDateString("id-ID")}</span>
              </div>
              <p className="flex gap-2 text-sm font-medium">
                <CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-600" />
                Human review diperlukan. Gunakan hasil ini sebagai bahan persiapan interview, bukan keputusan hire/reject.
              </p>
              <p className="text-sm text-muted-foreground">Langkah berikutnya: {result.insight.followUp}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

export default function TalentProfile() {
  const { candidateId } = useParams<{ candidateId: string }>();
  const router = useRouter();
  const {
    tokens,
    scans,
    scan,
    shortlisted,
    toggleShortlist,
    viewed,
    user,
    hydrated,
    screeningRunStatuses,
    startScreening,
    screeningResults,
    saveScreeningResult,
    devBypass,
    dbMode,
    bootstrapped,
    databaseError,
    partnerVerifications,
    screeningConsents,
    reloadBootstrap,
  } = useApp();

  const [remoteCandidate, setRemoteCandidate] = useState<Candidate | null>(null);
  const [loadedCandidateId, setLoadedCandidateId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [remoteScreeningCompleted, setRemoteScreeningCompleted] = useState(false);
  const [screeningError, setScreeningError] = useState<string | null>(null);
  const [openingConversation, setOpeningConversation] = useState(false);
  const [requestingContactConsent, setRequestingContactConsent] = useState(false);

  // Recruiter Hiring Flow modals
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [hiringOutcome, setHiringOutcome] = useState<string | null>(null);
  const [markingHired, setMarkingHired] = useState(false);

  const candidate = dbMode ? (loadedCandidateId === candidateId ? remoteCandidate : null) : findCandidate(candidateId) ?? null;

  const verif = candidate ? (partnerVerifications?.[candidate.id] ?? candidate.campusVerification) : undefined;

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { candidate?: Candidate };
        setRemoteCandidate(response.ok ? payload.candidate ?? null : null);
      })
      .catch(() => setRemoteCandidate(null))
      .finally(() => setLoadedCandidateId(candidateId));
  }, [candidateId, dbMode, bootstrapped]);

  useEffect(() => {
    if (!dbMode || !bootstrapped || !UUID_RE.test(candidateId)) return;
    void fetch(`/api/screening-runs?candidateProfileId=${encodeURIComponent(candidateId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { run?: { status?: string } | null };
        if (response.ok) setRemoteScreeningCompleted(payload.run?.status === "completed");
      })
      .catch(() => setRemoteScreeningCompleted(false));
  }, [candidateId, dbMode, bootstrapped]);

  useEffect(() => {
    if (candidate) viewed(candidate.id);
    // Tracking is intentionally keyed by the route, not by provider function identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  if (!hydrated || !user || user.role !== "recruiter")
    return (
      <ProtectedRoute role="recruiter">
        <div />
      </ProtectedRoute>
    );

  if (dbMode && (!bootstrapped || loadedCandidateId !== candidateId))
    return <div className="container mx-auto max-w-md px-4 py-16 text-center"><p className="text-sm text-muted-foreground" role="status">Memuat profil kandidat dari database...</p></div>;

  if (dbMode && databaseError)
    return <div className="container mx-auto max-w-md px-4 py-16 text-center"><p className="text-sm text-red-700" role="alert">Profil kandidat belum dapat dimuat. {databaseError}</p><Button className="mt-6" asChild><Link href="/search">Kembali ke pencarian</Link></Button></div>;

  if (!candidate)
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#7C3AED]">404 / Profil Tidak Ditemukan</p>
        <h1 className="mt-3 text-3xl font-bold">Profil ini sudah tidak tersedia.</h1>
        <p className="mt-3 text-muted-foreground">Coba cari kandidat lain di jaringan talent.</p>
        <Button className="mt-6" asChild>
          <Link href="/search">Kembali ke pencarian</Link>
        </Button>
      </div>
    );

  const unlocked = scans.some((item) => item.candidateId === candidate.id);
  const screeningStatus = screeningRunStatuses[candidate.id];
  const completed = hydrated && (dbMode ? remoteScreeningCompleted || screeningStatus === "completed" : screeningStatus === "completed");
  const contactConsent = screeningConsents[candidate.id];

  // startScreening only reports success/failure, so attribute dbMode failures via
  // the single-balance endpoint: token shortage is claimed only when the balance
  // is actually empty (the screening API signals that with 402). Consent is
  // optional since phase 6, so it is never blamed for a failure.
  const describeScreeningFailure = async (): Promise<string> => {
    if (!dbMode) return "Token screening tidak mencukupi.";
    try {
      const balanceResponse = await fetch("/api/tokens", { cache: "no-store" });
      const balanceData = (await balanceResponse.json()) as { token?: { balance?: number } };
      if (balanceResponse.ok && typeof balanceData.token?.balance === "number" && balanceData.token.balance <= 0) {
        return "Saldo token screening tidak mencukupi. Beli token lalu coba lagi.";
      }
    } catch {
      // Balance check is best-effort; fall through to the generic message.
    }
    return "Screening belum dapat dijalankan (consent bersifat opsional, bukan penyebabnya). Coba lagi.";
  };

  const startScan = () => {
    if (tokens <= 0 && !devBypass) {
      toast.error("Token tidak mencukupi", {
        description: "Beli token terlebih dahulu sebelum membuka profil baru.",
      });
      setConfirmOpen(false);
      return;
    }
    setScreeningError(null);
    setScanning(true);
    window.setTimeout(async () => {
      const opened = scan(candidate.id);
      if (!opened) {
        setScanning(false);
        return;
      }
      setConfirmOpen(false);
      const started = await startScreening(candidate.id);
      if (dbMode && started) setRemoteScreeningCompleted(true);
      if (!started) setScreeningError(await describeScreeningFailure());
      setScanning(false);
    }, 650);
  };

  const retryScreening = async () => {
    setScreeningError(null);
    const started = await startScreening(candidate.id);
    if (dbMode && started) setRemoteScreeningCompleted(true);
    if (!started) setScreeningError(await describeScreeningFailure());
  };

  const displayName = unlocked ? candidate.name : maskName(candidate.name);
  const isShortlisted = shortlisted.includes(candidate.id);

  const copyProfileLink = async () => {
    const url = window.location.href;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API tidak tersedia");
      await navigator.clipboard.writeText(url);
      toast.success("Tautan profil berhasil disalin");
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        if (!document.execCommand("copy")) throw new Error("execCommand gagal");
        toast.success("Tautan profil berhasil disalin");
      } catch {
        toast.error("Tautan gagal disalin", {
          description: "Browser menolak akses clipboard. Salin manual dari address bar.",
        });
      }
    }
  };

  const bannerSrc =
    candidate.bannerUrl ||
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/recruiter/discover" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke pencarian
      </Link>

      <Card className="mt-6 overflow-hidden border-slate-200 shadow-sm">
        {/* Banner Hero Photo */}
        <div className="relative h-44 sm:h-56 w-full overflow-hidden bg-linear-to-r from-purple-700 via-indigo-600 to-purple-800">
          <img
            src={bannerSrc}
            alt={`Banner ${displayName}`}
            loading="eager"
            decoding="async"
            className={cn(
              "h-full w-full object-cover transition-all duration-700",
              !unlocked ? "blur-md scale-105 opacity-70" : "blur-0 scale-100 opacity-100"
            )}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-black/10" />

          {/* Locked Overlay Badge if not yet scanned */}
          {!unlocked && (
            <div className="absolute top-4 right-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-1 text-xs font-semibold text-white/95 backdrop-blur-md border border-white/20 shadow-xs">
                <Lock className="size-3.5 text-amber-300" />
                Sampul & Foto Dikaburkan (Terkunci)
              </span>
            </div>
          )}
        </div>

        {/* Profile Info Row with Overlapping Avatar */}
        <div className="relative bg-white px-6 pb-6 pt-3 dark:bg-slate-900 sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="-mt-14 sm:-mt-18 relative shrink-0 z-20">
              <div className="relative size-24 sm:size-28 rounded-full border-4 border-white dark:border-slate-900 shadow-md overflow-hidden bg-slate-100 ring-1 ring-slate-900/10">
                <CandidateAvatar
                  initials={candidate.initials}
                  avatarUrl={candidate.avatarUrl}
                  name={displayName}
                  locked={!unlocked}
                  className="size-full text-base sm:text-lg"
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CandidateCategoryBadge category={candidate.talentCategory} />
                {candidate.careerStatus && (
                  <CandidateStatusBadge status={candidate.careerStatus} />
                )}
                {verif?.status === "verified" && (
                  <Badge className="bg-purple-100 text-purple-900 border-purple-200 shadow-xs font-semibold">
                    <GraduationCap className="mr-1 size-3.5 text-[#7C3AED]" />
                    Campus Verified · {verif.institution}
                  </Badge>
                )}
                {candidate.personality && (
                  <Badge variant="outline" className="border-purple-200 bg-purple-50/70 text-purple-900 font-semibold">
                    <Brain className="mr-1 size-3.5 text-purple-600" />
                    {candidate.personality.type} · {candidate.personality.label}
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  {displayName}
                </h1>
                {unlocked && (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-medium">
                    <UserCheck className="mr-1 size-3" /> Terbuka
                  </Badge>
                )}
              </div>

              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300 sm:text-base">
                {candidate.role} · {candidate.location}
              </p>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Pengalaman {candidate.experience} tahun · {candidate.availability}
                {unlocked && (
                  <span className="ml-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    · Ekspektasi Gaji: {candidate.salary}
                  </span>
                )}
              </p>
            </div>

            {/* Quick Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {unlocked && (
                <Button
                  size="sm"
                  className="bg-purple-600 text-white hover:bg-purple-700 font-semibold text-xs h-9 shadow-xs"
                  onClick={() => setAssignModalOpen(true)}
                >
                  <Briefcase className="mr-1.5 size-3.5" />
                  Masukkan ke Lowongan
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200"
                onClick={() => toggleShortlist(candidate.id)}
                aria-label={isShortlisted ? "Hapus dari shortlist" : "Simpan ke shortlist"}
                aria-pressed={isShortlisted}
              >
                <Bookmark className={cn("size-4 text-slate-600", isShortlisted && "fill-purple-600 text-purple-600")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-slate-200"
                onClick={() => void copyProfileLink()}
                aria-label="Salin tautan profil"
              >
                <Copy className="size-4 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── DOVER HIRING PROGRESS STEPPER ── */}
        <div className="border-b bg-slate-50/90 px-6 py-3.5 sm:px-10 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#7C3AED]" />
              Status Pipeline Dover
            </span>
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
              <div className="flex items-center gap-1.5 shrink-0 text-purple-900 font-semibold">
                <span className={`flex size-5 items-center justify-center rounded-full text-[10px] ${unlocked || completed ? "bg-purple-600 text-white" : "bg-purple-200 text-purple-950"}`}>
                  1
                </span>
                <span>Screening</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">→</span>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-700">
                <span className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-800">
                  2
                </span>
                <span>Wawancara</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">→</span>
              <div className="flex items-center gap-1.5 shrink-0 text-slate-700">
                <span className="flex size-5 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-800">
                  3
                </span>
                <span>Offer Letter</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">→</span>
              <div className={`flex items-center gap-1.5 shrink-0 ${hiringOutcome === "hired" ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                <span className={`flex size-5 items-center justify-center rounded-full text-[10px] ${hiringOutcome === "hired" ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                  ✓
                </span>
                <span>Hired</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD CONTENT ── */}
        {!unlocked ? (
          /* LOCKED STATE (Candidate Preview) */
          <CardContent className="space-y-8 px-6 py-8 sm:px-10">
            {/* Overview / AI Summary Preview */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Summary / Ringkasan Profil</h3>
              <p className="mt-2 leading-7 text-foreground">{candidate.summary}</p>
            </div>

            {/* Personality Highlight */}
            {candidate.personality && (
              <PersonalityOverview personality={candidate.personality} />
            )}

            {/* Skills & Tools Preview */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Hard Competencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="bg-slate-100 text-slate-700 border-purple-100">
                      <Wrench className="mr-1 size-3" />
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Locked Data Section & CTA */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
                  <ScanLine className="size-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-amber-950">Pembukaan Profil Diperlukan</h4>
                  <p className="mt-1 text-sm text-amber-900/80">
                    Untuk melihat data lengkap dan menghubungi kandidat ini, lakukan <strong>Buka Profil</strong>.
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs font-medium text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> Nama Lengkap
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> Email Langsung
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> Nomor Telepon / WA
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> CV (Unduh PDF)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> Profil LinkedIn
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-amber-700" /> Portofolio Lengkap
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-amber-200/60 pt-4">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-950">
                      <Lock className="size-3.5 shrink-0" aria-hidden="true" />
                      Ekspektasi gaji: Tersembunyi — buka profil untuk melihat
                    </span>
                    <Button
                      size="lg"
                       disabled={tokens <= 0 && !devBypass}
                      onClick={() => setConfirmOpen(true)}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <ScanLine className="mr-2 size-4" /> Buka Profil · 1 Token
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        ) : (
          /* UNLOCKED STATE (Talent Unlock) */
          <CardContent className="space-y-8 px-6 py-8 sm:px-10">
            {/* Contact & Links Bar */}
            <div className="rounded-xl border bg-slate-50/80 p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Kontak &amp; Profil Terbuka
              </p>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-primary shrink-0" />
                  {candidate.email ? (
                    <a href={`mailto:${candidate.email}`} className="min-w-0 truncate hover:underline font-medium text-foreground">
                      {candidate.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Email belum dicantumkan</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-primary shrink-0" />
                  {candidate.phone ? (
                    <a href={`tel:${candidate.phone}`} className="hover:underline font-medium text-foreground">
                      {candidate.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Nomor telepon belum dicantumkan</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="size-4 text-sky-600 shrink-0" />
                  {candidate.linkedin ? (
                    <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline flex items-center gap-1 font-medium">
                      Profil LinkedIn <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">LinkedIn belum dicantumkan</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Banknote className="size-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Ekspektasi Gaji</span>
                    <span className="font-mono font-semibold text-foreground truncate">{candidate.salary}</span>
                  </div>
                </div>
              </div>

              {/* Portfolio & CV buttons */}
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                {candidate.portfolio.map((url) => (
                  <Button key={url} variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 size-3.5 text-primary" /> {portfolioLabel(url)}
                    </a>
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCvPreviewOpen(true)}>
                  <FileText className="mr-1.5 size-3.5 text-primary" /> Pratinjau CV
                </Button>
                {completed ? <Button size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9]" asChild><Link href={`/recruiter/screenings/${candidate.id}`}><ShieldCheck className="mr-1.5 size-3.5" />Lihat Screening Selesai</Link></Button> : screeningError ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Screening perlu retry</Badge> : <Badge variant="outline" className="border-purple-200 bg-purple-50 text-[#7C3AED]"><Loader2 className="mr-1.5 size-3 animate-spin" />Screening otomatis</Badge>}
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tentang Saya</p>
              <p className="mt-2 leading-7 text-foreground">{candidate.summary}</p>
            </div>

            {/* Personality Highlight */}
            {candidate.personality && (
              <PersonalityOverview personality={candidate.personality} />
            )}

            {/* Skills & Tools */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Hard Competencies</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Tools</p>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.tools.map((tool) => (
                    <Badge key={tool} variant="secondary" className="bg-slate-100 text-slate-700 border-purple-100">
                      <Wrench className="mr-1 size-3" />
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience */}
            <div>
              <p className="mb-3 text-sm font-semibold">Pengalaman Kerja</p>
              <div className="space-y-3">
                {candidate.history.map((item) => (
                  <div
                    key={`${item.company}-${item.role}`}
                    className="flex flex-col justify-between gap-1 rounded-xl border p-4 sm:flex-row"
                  >
                    <div>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-sm text-muted-foreground">{item.company}</p>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{item.years}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Campus Partnership */}
            <div>
              <p className="mb-3 text-sm font-semibold flex items-center gap-1.5">
                <GraduationCap className="size-4 text-[#7C3AED]" /> Pendidikan & Verifikasi Kampus
              </p>
              <div className="rounded-xl border p-4 bg-slate-50/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{candidate.education}</p>
                    <p className="text-xs text-muted-foreground">
                      {verif?.program ? `${verif.program} · Angkatan ${verif.year}` : "Lulusan Perguruan Tinggi"}
                    </p>
                  </div>
                  {verif?.status === "verified" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      ✓ Terverifikasi oleh {verif.verifiedBy || `${verif.institution} Career Center`}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      ⏳ Pending Verifikasi Career Center
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {(unlocked || (dbMode && completed)) && (
        <>
          {dbMode && completed && (
            <Card className="mt-6 border-[#b9e6d0] bg-[#f7fffb]">
              <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-[#08744f]">Screening tersimpan</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pemotongan token dan skor sudah tercatat. Kandidat tetap perlu menyetujui permintaan kontak sebelum percakapan dimulai.
                  </p>
                </div>
                {contactConsent === "consented" ? (
                  <Button
                    disabled={openingConversation}
                    onClick={async () => {
                      setOpeningConversation(true);
                      try {
                        const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateProfileId: candidate.id }) });
                        const payload = await response.json() as { conversationId?: string; error?: string };
                        if (!response.ok || !payload.conversationId) throw new Error(payload.error ?? "Percakapan belum dapat dibuat.");
                        router.push(`/recruiter/messages?conversationId=${encodeURIComponent(payload.conversationId)}`);
                      } catch (error) {
                        toast.error("Percakapan belum dapat dibuat", { description: error instanceof Error ? error.message : "Coba lagi." });
                      } finally {
                        setOpeningConversation(false);
                      }
                    }}
                  >
                    {openingConversation ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    {openingConversation ? "Membuka..." : "Mulai percakapan"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={requestingContactConsent || contactConsent === "pending-candidate-consent"}
                    onClick={async () => {
                      setRequestingContactConsent(true);
                      try {
                        const response = await fetch("/api/consent-requests", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            candidateProfileIds: [candidate.id],
                            purpose: "Diskusi peluang setelah screening",
                            message: "Recruiter ingin mendiskusikan hasil screening dan peluang yang relevan.",
                          }),
                        });
                        const payload = await response.json() as { error?: string };
                        if (!response.ok) throw new Error(payload.error ?? "Permintaan kontak belum dapat dikirim.");
                        await reloadBootstrap();
                        toast.success("Permintaan kontak dikirim", { description: "Tunggu persetujuan kandidat sebelum memulai percakapan." });
                      } catch (error) {
                        toast.error("Permintaan kontak gagal", { description: error instanceof Error ? error.message : "Coba lagi." });
                      } finally {
                        setRequestingContactConsent(false);
                      }
                    }}
                  >
                    {requestingContactConsent ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                    {requestingContactConsent ? "Mengirim..." : contactConsent === "pending-candidate-consent" ? "Menunggu persetujuan kandidat" : "Minta izin menghubungi"}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          <ScreeningResults
            candidateId={candidate.id}
            candidate={candidate}
            completed={completed}
            screeningStatus={screeningStatus}
            screeningError={screeningError}
            onRetry={() => void retryScreening()}
            result={screeningResults[candidate.id]}
            saveResult={saveScreeningResult}
          />
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={(open) => !scanning && setConfirmOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buka Profil Kandidat?</DialogTitle>
            <DialogDescription>
               Tindakan ini akan membuka Nama Lengkap, Email, Nomor Telepon, CV, LinkedIn, dan Portofolio. Setelah unlock berhasil, screening role-fit akan otomatis dijalankan.
               {devBypass ? " Mode development: token scan tidak digunakan." : ` Sisa token Anda: ${tokens} token.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={scanning} onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button disabled={scanning || (tokens <= 0 && !devBypass)} onClick={startScan}>
              {scanning && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {scanning ? "Membuka profil & menyiapkan screening..." : "Konfirmasi Buka Profil · 1 Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CV Preview Dialog */}
      <Dialog open={cvPreviewOpen} onOpenChange={setCvPreviewOpen}>
        <DialogContent id="cv-print-sheet" className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <style>{CV_PRINT_CSS}</style>
          <DialogHeader>
            <DialogTitle>Pratinjau CV (ATS)</DialogTitle>
            <DialogDescription>
              Format satu kolom siap diekspor. Ekspor memakai fitur cetak browser — aplikasi ini demo dan tidak membuat file PDF secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <article className="space-y-5 rounded-md border bg-white p-6 text-[#111827]">
            <header>
              <h3 className="text-xl font-bold tracking-tight">{candidate.name}</h3>
              <p className="mt-1 text-sm text-[#374151]">
                {candidate.role} · {candidate.location} · {candidate.experience} tahun pengalaman
              </p>
              <p className="mt-2 break-all text-sm text-[#374151]">
                {candidate.email} · {candidate.phone} · {candidate.linkedin}
              </p>
            </header>

            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t pt-3 font-mono text-xs text-[#374151]">
              <span>Versi CV: 1.0 · Demo</span>
              <span>
                Dibuat:{" "}
                {new Date().toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wider">Ringkasan</h4>
              <p className="mt-2 text-sm leading-6 text-[#374151]">{candidate.summary}</p>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wider">Skill &amp; Tools</h4>
              <p className="mt-2 text-sm leading-6 text-[#374151]">
                <span className="font-semibold">Skill:</span> {candidate.skills.join(", ")}
              </p>
              <p className="text-sm leading-6 text-[#374151]">
                <span className="font-semibold">Tools:</span> {candidate.tools.join(", ")}
              </p>
            </section>

            <section>
              <h4 className="text-sm font-semibold uppercase tracking-wider">Pengalaman Kerja</h4>
              <ul className="mt-2 space-y-2">
                {candidate.history.map((item) => (
                  <li key={`${item.company}-${item.role}`} className="text-sm leading-6">
                    <span className="font-semibold">{item.role}</span>
                    <span className="text-[#374151]"> — {item.company}</span>
                    <span className="block font-mono text-xs text-[#374151]">{item.years}</span>
                  </li>
                ))}
              </ul>
            </section>

            <p className="border-t pt-3 text-xs text-[#374151]">
              Dokumen demo yang dihasilkan ProofyLink berdasarkan data profil kandidat di aplikasi.
            </p>
          </article>

          <DialogFooter data-print-hide className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCvPreviewOpen(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                toast.info("Dialog cetak dibuka", {
                  description: "Pilih tujuan \u201CSave as PDF\u201D untuk menyimpan CV ini. Ekspor demo — tidak ada file PDF yang dibuat otomatis.",
                });
                window.print();
              }}
            >
              <Printer className="mr-2 size-4" /> Cetak / Simpan sebagai PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── FLOATING DOVER ACTION WIDGET (ONLY APPEARS AFTER TOKEN SCAN) ── */}
      {unlocked && (
        <aside
          aria-label="Aksi Cepat Rekruter"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl rounded-2xl border border-purple-200/80 bg-white/95 p-3 shadow-[0_12px_36px_rgba(124,58,237,0.18)] backdrop-blur-md dark:border-purple-900/60 dark:bg-slate-900/95 xl:bottom-auto xl:left-auto xl:right-6 2xl:right-12 xl:top-36 xl:translate-x-0 xl:w-64 xl:p-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-purple-100 pb-2.5 dark:border-purple-950/60 xl:flex-col xl:items-start xl:gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-pink-500 text-white shadow-xs">
                <Sparkles className="size-3.5" />
              </span>
              <div>
                <p className="text-xs font-bold leading-tight text-foreground truncate max-w-[130px] xl:max-w-[170px]">
                  {candidate.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Alur Rekrutmen Dover
                </p>
              </div>
            </div>
            {hiringOutcome === "hired" ? (
              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5">
                <UserCheck className="mr-1 size-3" /> Hired ✓
              </Badge>
            ) : (
              <Badge variant="outline" className="border-purple-300 text-purple-800 dark:border-purple-700 dark:text-purple-300 text-[10px] px-2 py-0.5">
                Pipeline Aktif
              </Badge>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-end gap-1.5 xl:mt-3 xl:flex-col xl:items-stretch xl:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-900 px-2.5 dark:border-purple-800 xl:h-9 xl:justify-start"
              onClick={() => setQuestionModalOpen(true)}
            >
              <Brain className="mr-1.5 size-3.5 text-[#7C3AED]" />
              Pertanyaan AI
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-900 px-2.5 dark:border-purple-800 xl:h-9 xl:justify-start"
              onClick={() => setPromptModalOpen(true)}
            >
              <MessageSquareQuote className="mr-1.5 size-3.5 text-[#7C3AED]" />
              Prompt Pesan
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-purple-200 hover:bg-purple-50 hover:text-purple-900 px-2.5 dark:border-purple-800 xl:h-9 xl:justify-start"
              onClick={() => setScheduleModalOpen(true)}
            >
              <Calendar className="mr-1.5 size-3.5 text-[#7C3AED]" />
              Jadwal Wawancara
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 px-2.5 dark:border-emerald-800 dark:text-emerald-300 xl:h-9 xl:justify-start"
              onClick={() => setOfferModalOpen(true)}
            >
              <FileCheck2 className="mr-1.5 size-3.5 text-emerald-600" />
              Buat Offer Letter
            </Button>
            <Button
              size="sm"
              disabled={markingHired || hiringOutcome === "hired"}
              className="h-8 text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-3 xl:h-9 xl:w-full"
              onClick={async () => {
                if (!window.confirm(`Konfirmasi tandai ${candidate.name} sebagai DITERIMA (HIRED)?`)) return;
                setMarkingHired(true);
                try {
                  if (dbMode) {
                    const res = await fetch("/api/applications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        candidateProfileId: candidate.id,
                        status: "hired",
                        reason: "Kandidat diterima secara resmi melalui Talent Network.",
                      }),
                    });
                    if (!res.ok) {
                      const errData = (await res.json()) as { error?: string };
                      throw new Error(errData.error ?? "Gagal memperbarui status ke Hired.");
                    }
                  }
                  setHiringOutcome("hired");
                  toast.success(`Kandidat ${candidate.name} resmi ditandai Diterima (Hired)!`);
                } catch (err) {
                  toast.error("Gagal menandai status Hired", {
                    description: err instanceof Error ? err.message : "Terjadi kesalahan.",
                  });
                } finally {
                  setMarkingHired(false);
                }
              }}
            >
              {markingHired ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <UserCheck className="mr-1.5 size-3.5" />}
              {hiringOutcome === "hired" ? "Sudah Diterima ✓" : "Tandai Diterima (Hired)"}
            </Button>
          </div>
        </aside>
      )}

      {/* Recruiter Hiring Flow Modals */}
      <InterviewQuestionModal
        open={questionModalOpen}
        onOpenChange={setQuestionModalOpen}
        candidate={candidate}
        onSaveQuestions={() => {
          setQuestionModalOpen(false);
          setScheduleModalOpen(true);
        }}
      />

      <PromptedOutreachComposer
        open={promptModalOpen}
        onOpenChange={setPromptModalOpen}
        candidate={candidate}
        onMessageSent={() => {
          setPromptModalOpen(false);
        }}
      />

      <ScheduleInterviewModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        candidate={candidate}
        onScheduled={() => {
          setScheduleModalOpen(false);
        }}
      />

      <CreateOfferModal
        open={offerModalOpen}
        onOpenChange={setOfferModalOpen}
        candidate={candidate}
        onOfferSent={() => {
          setOfferModalOpen(false);
        }}
      />

      <AssignToJobModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        candidate={candidate}
      />
    </div>
  );
}
