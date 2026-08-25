"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, Clock3, Filter, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { candidates as demoCandidates } from "@/data/candidates";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/providers/app-provider";
import type { Candidate, ConsentState, ScreeningResult } from "@/types";

type ScreeningRow = { id: string; candidateId: string; name: string; role: string; location: string; state: ConsentState; result?: ScreeningResult; updatedAt?: string };
type RemoteRequest = { candidateProfileId?: unknown; consentState?: unknown; createdAt?: unknown; respondedAt?: unknown };

const stateCopy: Record<ConsentState, { label: string; className: string }> = {
  "not-requested": { label: "Belum diminta", className: "bg-slate-100 text-slate-700" },
  "pending-candidate-consent": { label: "Menunggu consent", className: "bg-amber-50 text-amber-800" },
  consented: { label: "Siap dijalankan", className: "bg-emerald-50 text-emerald-800" },
  declined: { label: "Ditolak", className: "bg-red-50 text-red-800" },
  "consent-expired": { label: "Consent kedaluwarsa", className: "bg-amber-50 text-amber-800" },
  withdrawn: { label: "Consent ditarik", className: "bg-slate-100 text-slate-700" },
  "screening-in-progress": { label: "Sedang diproses", className: "bg-purple-50 text-purple-800" },
  "screening-completed": { label: "Selesai", className: "bg-emerald-50 text-emerald-800" },
  disputed: { label: "Perlu ditinjau", className: "bg-red-50 text-red-800" },
};

function formatDate(value?: string) {
  if (!value) return "Belum ada aktivitas";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function ScreeningQueuePage() {
  const { dbMode, bootstrapped, databaseError, screeningConsents, screeningResults, consentRequests, screeningTokens } = useApp();
  const [remoteCandidates, setRemoteCandidates] = useState<Candidate[]>([]);
  const [tab, setTab] = useState<"all" | "action" | "history">("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!dbMode || !bootstrapped) return;
    void fetch("/api/candidates", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { candidates?: Candidate[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Kandidat belum dapat dimuat.");
      setRemoteCandidates(payload.candidates ?? []);
    }).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : "Kandidat belum dapat dimuat."));
  }, [dbMode, bootstrapped]);

  const candidates = dbMode && remoteCandidates.length ? remoteCandidates : demoCandidates;
  const rows = useMemo<ScreeningRow[]>(() => {
    if (dbMode) {
      return (consentRequests as RemoteRequest[]).flatMap((request) => {
        const candidateId = typeof request.candidateProfileId === "string" ? request.candidateProfileId : null;
        if (!candidateId) return [];
        const candidate = candidates.find((item) => item.id === candidateId);
        if (!candidate) return [];
        const state = typeof request.consentState === "string" && request.consentState in stateCopy ? request.consentState as ConsentState : "not-requested";
        return [{ id: candidateId, candidateId, name: candidate.name, role: candidate.role, location: candidate.location, state, updatedAt: typeof request.respondedAt === "string" ? request.respondedAt : typeof request.createdAt === "string" ? request.createdAt : undefined }];
      });
    }
    return Object.entries(screeningConsents).flatMap(([candidateId, state]) => {
      const candidate = candidates.find((item) => item.id === candidateId);
      if (!candidate) return [];
      return [{ id: candidateId, candidateId, name: candidate.name, role: candidate.role, location: candidate.location, state, result: screeningResults[candidateId], updatedAt: screeningResults[candidateId]?.fetchedAt }];
    }).sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [candidates, consentRequests, dbMode, screeningConsents, screeningResults]);

  const visibleRows = rows.filter((row) => tab === "all" || (tab === "action" ? ["pending-candidate-consent", "consented", "disputed"].includes(row.state) : row.state === "screening-completed"));
  const actionCount = rows.filter((row) => ["pending-candidate-consent", "consented", "disputed"].includes(row.state)).length;

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-6xl px-4 py-8 sm:py-10">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div><p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary"><ClipboardCheck className="size-4" /> Recruiter operations</p><h1 className="mt-3 text-3xl font-bold tracking-tight">Screening queue</h1><p className="mt-2 max-w-2xl text-muted-foreground">Pantau consent dan insight screening berbasis profil dari satu tempat. Screening bukan keputusan hire atau reject.</p></div>
      <Button asChild><Link href="/recruiter/screenings/new"><Plus className="size-4" /> Screening baru</Link></Button>
    </div>
    {dbMode && databaseError && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">Data database belum dapat dimuat. {databaseError}</div>}
    {dbMode && loadError && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">Daftar kandidat belum dapat dimuat. {loadError}</div>}
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total screening</p><p className="mt-2 text-3xl font-bold">{rows.length}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Perlu tindakan</p><p className="mt-2 text-3xl font-bold text-amber-700">{actionCount}</p></CardContent></Card><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Screening token</p><p className="mt-2 text-3xl font-bold">{screeningTokens}</p></CardContent></Card></div>
    <Card className="mt-8"><CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Screening activity</CardTitle><p className="mt-1 text-sm text-muted-foreground">Consent tetap menjadi syarat sebelum screening dijalankan.</p></div><div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter screening"><Button variant={tab === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("all")} role="tab" aria-selected={tab === "all"}><Filter className="size-3.5" /> Semua</Button><Button variant={tab === "action" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("action")} role="tab" aria-selected={tab === "action"}>Perlu tindakan</Button><Button variant={tab === "history" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("history")} role="tab" aria-selected={tab === "history"}>Riwayat</Button></div></CardHeader><CardContent className="pt-0">
      {dbMode && !bootstrapped ? <div className="rounded-xl bg-muted p-8 text-center text-sm text-muted-foreground" role="status">Memuat screening...</div> : visibleRows.length ? <div className="divide-y">{visibleRows.map((row) => { const status = stateCopy[row.state]; return <div key={row.id} className="flex flex-col gap-4 py-5 first:pt-2 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-primary"><ShieldCheck className="size-5" /></div><div className="min-w-0"><p className="truncate font-semibold">{row.name}</p><p className="truncate text-sm text-muted-foreground">{row.role} · {row.location}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3" /> {formatDate(row.updatedAt)}</p></div></div><div className="flex items-center justify-between gap-3 sm:justify-end"><Badge className={status.className}>{status.label}</Badge>{row.result && <span className="font-mono text-sm font-semibold">{row.result.insight.score}/100</span>}<Button variant="outline" size="sm" asChild><Link href={`/recruiter/screenings/${row.candidateId}`}>Buka <ArrowRight className="size-3.5" /></Link></Button></div></div>; })}</div> : <div className="rounded-xl bg-muted p-8 text-center"><Sparkles className="mx-auto size-8 text-primary" /><p className="mt-3 font-semibold">Belum ada aktivitas screening</p><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Mulai dari profil kandidat, minta consent, lalu kembali ke queue ini untuk melihat statusnya.</p><Button className="mt-4" size="sm" asChild><Link href="/recruiter/discover">Cari kandidat</Link></Button></div>}
    </CardContent></Card>
    <p className="mt-5 text-xs leading-5 text-muted-foreground">{dbMode ? "Database mode: riwayat organisasi penuh belum tersedia pada API saat ini; daftar di atas bersumber dari consent aktif." : "Demo mode: status screening berasal dari state lokal browser dan bukan data produksi."}</p>
  </main></ProtectedRoute>;
}
