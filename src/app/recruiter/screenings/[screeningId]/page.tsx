"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileQuestion, Loader2, MessageSquare, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { findCandidate } from "@/data/candidates";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import type { Candidate, ScreeningResult } from "@/types";

type Run = {
  id: string;
  status: string;
  startedAt?: string | null;
  completedAt?: string | null;
  score?: {
    score?: number;
    label?: string;
    coverage?: number;
    evidence?: string[];
    limitations?: string[];
    source?: string;
    modelVersion?: string;
  } | null;
};

export default function ScreeningDetailPage() {
  const { screeningId } = useParams<{ screeningId: string }>();
  const router = useRouter();
  const { dbMode, bootstrapped, screeningConsents, screeningResults, startScreening, screeningTokens } = useApp();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningScreening, setRunningScreening] = useState(false);

  const localResult: ScreeningResult | undefined = screeningResults[screeningId];
  const consent = screeningConsents[screeningId];

  useEffect(() => {
    if (dbMode && !bootstrapped) return;
    let active = true;
    const load = async () => {
      try {
        if (!dbMode) {
          if (active) setCandidate(findCandidate(screeningId) ?? null);
          return;
        }
        const response = await fetch(`/api/candidates/${encodeURIComponent(screeningId)}`, { cache: "no-store" });
        const payload = (await response.json()) as { candidate?: Candidate; error?: string };
        if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan.");
        const runResponse = await fetch(`/api/screening-runs?candidateProfileId=${encodeURIComponent(screeningId)}`, { cache: "no-store" });
        const runPayload = (await runResponse.json()) as { run?: Run; error?: string };
        if (active) {
          setCandidate(payload.candidate);
          setRun(runPayload.run ?? null);
          if (!runResponse.ok) setError(runPayload.error ?? "Run belum dapat dimuat.");
        }
      } catch (reason: unknown) {
        if (active) setError(reason instanceof Error ? reason.message : "Detail screening belum dapat dimuat.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [bootstrapped, dbMode, screeningId]);

  const insight = dbMode ? run?.score : localResult?.insight;
  const status = dbMode ? run?.status : consent === "screening-completed" ? "completed" : consent;

  const handleStartScreeningInline = async () => {
    setRunningScreening(true);
    try {
      const ok = await startScreening(screeningId);
      if (ok) {
        toast.success("Screening selesai dijalankan", {
          description: "Insight dan skor kesesuaian peran telah diperbarui.",
        });
        if (dbMode) {
          router.refresh();
        }
      } else {
        toast.error("Gagal menjalankan screening", {
          description: "Pastikan saldo token mencukupi dan consent telah diberikan.",
        });
      }
    } catch (err) {
      toast.error("Terjadi kendala saat screening", {
        description: err instanceof Error ? err.message : "Coba lagi.",
      });
    } finally {
      setRunningScreening(false);
    }
  };

  return (
    <ProtectedRoute role="recruiter">
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <Link
          href="/recruiter/screenings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Kembali ke screening queue
        </Link>

        {loading ? (
          <div className="mt-8 rounded-xl border p-8 text-center text-sm text-muted-foreground" role="status">
            Memuat detail screening...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800" role="alert">
            {error}
          </div>
        ) : !candidate ? (
          <div className="mt-8 rounded-xl border p-8 text-center">
            <p className="font-semibold">Screening tidak ditemukan</p>
            <p className="mt-1 text-sm text-muted-foreground">ID ini belum memiliki konteks kandidat yang dapat ditampilkan.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
                  <ShieldCheck className="size-4" /> Screening detail
                </p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">{candidate.name}</h1>
                <p className="mt-2 text-muted-foreground">
                  {candidate.role} · {candidate.location}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href={`/recruiter/discover/${candidate.id}`}>
                    <UserRound className="size-4 mr-1.5" /> Profil
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/recruiter/screenings/${screeningId}/questions`}>
                    <FileQuestion className="size-4 mr-1.5" /> Interview questions
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Screening insight</CardTitle>
                      <p className="mt-2 text-sm text-muted-foreground">Insight role fit dan kualitas data untuk membantu human review.</p>
                    </div>
                    <Badge
                      className={
                        status === "completed"
                          ? "bg-emerald-50 text-emerald-800"
                          : status === "consented"
                          ? "bg-purple-50 text-purple-800"
                          : "bg-amber-50 text-amber-800"
                      }
                    >
                      {status === "completed"
                        ? "Selesai"
                        : status === "consented"
                        ? "Consent Aktif · Siap Screening"
                        : status === "pending-candidate-consent"
                        ? "Menunggu Jawaban Kandidat"
                        : "Belum Selesai"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {insight ? (
                    <>
                      <div className="flex flex-wrap items-end gap-4">
                        <p className="font-mono text-5xl font-bold text-primary">
                          {insight.score}
                          <span className="text-xl text-muted-foreground">/100</span>
                        </p>
                        <div>
                          <p className="font-semibold">{insight.label}</p>
                          <p className="text-sm text-muted-foreground">Coverage {insight.coverage}%</p>
                        </div>
                      </div>
                      <section className="mt-7">
                        <h2 className="font-semibold">Evidence yang tersedia</h2>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {insight.evidence?.map((item) => (
                            <li key={item} className="flex gap-2">
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-950">Batasan dan human review</p>
                        <ul className="mt-2 space-y-1 text-sm text-amber-900">
                          {insight.limitations?.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </section>
                      <p className="mt-5 text-xs text-muted-foreground">
                        Source: {insight.source ?? "internal"} · Model: {insight.modelVersion ?? "1.0"}
                      </p>

                      {/* Next Step Action Toolbar */}
                      <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
                        <Button asChild className="bg-[#7C3AED] hover:bg-[#6D28D9]">
                          <Link href={`/recruiter/screenings/${screeningId}/questions`}>
                            <FileQuestion className="mr-2 size-4" /> Buka Interview Questions
                          </Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href={`/recruiter/messages`}>
                            <MessageSquare className="mr-2 size-4" /> Kirim Pesan
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl bg-muted p-6 text-center sm:text-left">
                      <Sparkles className="size-6 text-primary" />
                      <p className="mt-3 font-semibold">Belum ada insight screening</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pastikan consent disetujui kandidat sebelum menjalankan screening satu token.
                      </p>
                      {consent === "consented" && (
                        <Button
                          className="mt-5 bg-[#7C3AED] hover:bg-[#6D28D9]"
                          onClick={handleStartScreeningInline}
                          disabled={runningScreening || screeningTokens <= 0}
                        >
                          {runningScreening ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="mr-2 size-4" />
                          )}
                          {runningScreening ? "Menjalankan screening..." : "Mulai screening · 1 token"}
                        </Button>
                      )}
                      {consent !== "consented" && (
                        <Button asChild className="mt-5" variant="outline">
                          <Link href={`/recruiter/screenings/new?candidateId=${candidate.id}`}>
                            Kelola Permintaan Consent &rarr;
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Run timeline &amp; Navigasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 text-sm">
                  <div className="flex gap-3">
                    <Clock3 className="size-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Status saat ini</p>
                      <p className="text-muted-foreground">
                        {status === "completed" ? "Insight tersimpan & siap di-review" : "Menunggu langkah berikutnya"}
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold">Consent kandidat</p>
                    <p className="mt-1 text-muted-foreground">
                      {consent === "consented" || status === "completed"
                        ? "Disetujui kandidat"
                        : consent === "pending-candidate-consent"
                        ? "Menunggu persetujuan kandidat"
                        : "Belum diminta"}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold">Aksi Cepat</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <Link href={`/recruiter/screenings/${screeningId}/questions`}>
                          <FileQuestion className="mr-2 size-3.5" /> Interview Questions Guide
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="justify-start" asChild>
                        <Link href={`/recruiter/discover/${candidate.id}`}>
                          <UserRound className="mr-2 size-3.5" /> Detail Profil Kandidat
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" asChild>
                        <Link href="/recruiter/screenings">
                          <ArrowLeft className="mr-2 size-3.5" /> Kembali ke Queue
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl border bg-card p-4 text-sm shadow-xs">
              <p className="text-muted-foreground">Butuh percakapan terstruktur untuk validasi bukti profil?</p>
              <Link
                href={`/recruiter/screenings/${screeningId}/questions`}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                Buka workspace pertanyaan <ArrowRight className="size-4" />
              </Link>
            </div>
          </>
        )}
      </main>
    </ProtectedRoute>
  );
}
