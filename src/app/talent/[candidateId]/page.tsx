"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { findCandidate } from "@/data/candidates";
import { maskName } from "@/lib/candidate-display";
import { useApp } from "@/providers/app-provider";
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
import { ProtectedRoute } from "@/components/auth/protected-route";
import type { AiSummary, Candidate, ScreeningInsight, ScreeningResult } from "@/types";

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
  result,
  saveResult,
}: {
  candidateId: string;
  candidate: Candidate;
  completed: boolean;
  result?: ScreeningResult;
  saveResult: (candidateId: string, result: ScreeningResult) => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "error">(
    result ? "idle" : completed ? "loading" : "idle",
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
       const isDatabaseCandidate = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidateId);
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
            Insight berbasis role fit dan kualitas data, ditampilkan setelah consent kandidat dan screening selesai.
          </p>
        </div>
        {completed && (
          <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-[#7C3AED]">
            <FileCheck2 className="mr-1 size-3" /> Screening selesai
          </Badge>
        )}
      </div>

      {!completed && (
        <Card className="mt-5 border-dashed bg-muted/30">
          <CardContent className="flex gap-3 p-5">
            <CircleHelp className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-semibold text-[#111827]">Hasil belum tersedia</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Selesaikan consent kandidat dan screening terlebih dahulu. Hasil tidak ditampilkan hanya karena profil sudah dibuka.
              </p>
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
    screeningConsents,
    screeningResults,
    saveScreeningResult,
    devBypass,
    dbMode,
    bootstrapped,
    databaseError,
  } = useApp();

  const [remoteCandidate, setRemoteCandidate] = useState<Candidate | null>(null);
  const [loadedCandidateId, setLoadedCandidateId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [remoteScreeningCompleted, setRemoteScreeningCompleted] = useState(false);
  const [openingConversation, setOpeningConversation] = useState(false);
  const candidate = dbMode ? (loadedCandidateId === candidateId ? remoteCandidate : null) : findCandidate(candidateId) ?? null;

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
    if (!dbMode || !bootstrapped || !/^[0-9a-f-]{36}$/i.test(candidateId)) return;
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

  if (!user || user.role !== "recruiter")
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
  const completed = hydrated && (dbMode ? remoteScreeningCompleted : screeningConsents[candidate.id] === "screening-completed");

  const startScan = () => {
    if (tokens <= 0 && !devBypass) {
      toast.error("Token tidak mencukupi", {
        description: "Beli token terlebih dahulu sebelum membuka profil baru.",
      });
      setConfirmOpen(false);
      return;
    }
    setScanning(true);
    window.setTimeout(() => {
      scan(candidate.id);
      setScanning(false);
      setConfirmOpen(false);
    }, 650);
  };

  const displayName = unlocked ? candidate.name : maskName(candidate.name);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Kembali ke pencarian
      </Link>

      <Card className="mt-6 overflow-hidden">
        {/* Banner Hero */}
        <div className="bg-primary px-6 py-8 text-primary-foreground sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <CandidateAvatar
              initials={candidate.initials}
              locked={!unlocked}
              className="size-20 bg-primary-foreground/15 text-primary-foreground"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CandidateCategoryBadge category={candidate.talentCategory} />
                {candidate.careerStatus && (
                  <CandidateStatusBadge status={candidate.careerStatus} />
                )}
              </div>

              <p className="mt-2 text-2xl font-bold tracking-tight">
                {displayName}
              </p>
              <p className="mt-1 text-primary-foreground/80">
                {candidate.role} · {candidate.location}
              </p>
              <p className="mt-2 text-xs text-primary-foreground/75">
                Pengalaman {candidate.experience} tahun · {candidate.availability}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => toggleShortlist(candidate.id)}
                aria-label="Simpan ke shortlist"
              >
                <Bookmark className={shortlisted.includes(candidate.id) ? "fill-primary" : ""} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast.success("Tautan profil berhasil disalin");
                }}
                aria-label="Salin tautan profil"
              >
                <Copy />
              </Button>
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

            {/* Skills & Tools Preview */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Skill</p>
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
                    <span className="font-mono text-sm font-semibold text-amber-950">
                      Ekspektasi gaji: {candidate.salary}
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
                  <a href={`mailto:${candidate.email}`} className="min-w-0 truncate hover:underline">
                    {candidate.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-primary shrink-0" />
                  <a href={`tel:${candidate.phone}`} className="hover:underline">
                    {candidate.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="size-4 text-sky-600 shrink-0" />
                  <a href={candidate.linkedin} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline flex items-center gap-1">
                    Profil LinkedIn <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {/* Portfolio & CV buttons */}
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
                {candidate.portfolio.map((url, idx) => (
                  <Button key={idx} variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 size-3.5 text-primary" /> Portofolio #{idx + 1}
                    </a>
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={() => toast.info("Mengunduh CV...", { description: `${candidate.name}_CV.pdf` })}>
                  <FileText className="mr-1.5 size-3.5 text-primary" /> Unduh CV PDF
                </Button>
              </div>
            </div>

            {/* About */}
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tentang Saya</p>
              <p className="mt-2 leading-7 text-foreground">{candidate.summary}</p>
            </div>

            {/* Skills & Tools */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold">Skill</p>
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
                  <p className="mt-1 text-sm text-muted-foreground">Consent kandidat, pemotongan token, dan skor sudah tercatat. Anda dapat memulai percakapan yang berwenang.</p>
                </div>
                <Button
                  disabled={openingConversation}
                  onClick={async () => {
                    setOpeningConversation(true);
                    try {
                      const response = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ candidateProfileId: candidate.id }) });
                      const payload = await response.json() as { conversationId?: string; error?: string };
                      if (!response.ok || !payload.conversationId) throw new Error(payload.error ?? "Percakapan belum dapat dibuat.");
                      router.push(`/messages?conversationId=${encodeURIComponent(payload.conversationId)}`);
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
              </CardContent>
            </Card>
          )}
          <ScreeningResults
            candidateId={candidate.id}
            candidate={candidate}
            completed={completed}
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
               Tindakan ini akan membuka Nama Lengkap, Email, Nomor Telepon, CV, LinkedIn, dan Portofolio.
               {devBypass ? " Mode development: token scan tidak digunakan." : ` Sisa token Anda: ${tokens} token.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={scanning} onClick={() => setConfirmOpen(false)}>
              Batal
            </Button>
            <Button disabled={scanning || (tokens <= 0 && !devBypass)} onClick={startScan}>
              {scanning && <Loader2 className="size-4 animate-spin mr-1.5" />}
              {scanning ? "Membuka profil..." : "Konfirmasi Buka Profil · 1 Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
