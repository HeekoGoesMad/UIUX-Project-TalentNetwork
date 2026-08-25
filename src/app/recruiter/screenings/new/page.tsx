"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { findCandidate } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";
export default function Page() {
  const { screeningTokens, screeningConsents, requestConsent, startScreening, dbMode, bootstrapped, databaseError } = useApp();
  const [candidateId, setCandidateId] = useState("");
  const [candidate, setCandidate] = useState<{ id: string; name: string | null; role: string | null; location: string | null } | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  useEffect(() => {
    if (dbMode && !bootstrapped) return;
    const requestedId = new URLSearchParams(window.location.search).get("candidateId");
    const timer = window.setTimeout(() => {
      if (!requestedId) {
        if (dbMode) setCandidateError("Kandidat belum dipilih.");
        else setCandidateId("candidate-1");
      } else setCandidateId(requestedId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [dbMode, bootstrapped]);
  useEffect(() => {
    if (!candidateId || (dbMode && !bootstrapped)) return;
    let active = true;
    if (!dbMode) {
      const fixture = findCandidate(candidateId);
      const timer = window.setTimeout(() => {
        if (active) {
          setCandidate(fixture ? { id: fixture.id, name: fixture.name, role: fixture.role, location: fixture.location } : null);
          setCandidateError(fixture ? null : "Kandidat tidak ditemukan.");
        }
      }, 0);
      return () => { active = false; window.clearTimeout(timer); };
    }
    void fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { candidate?: typeof candidate; error?: string };
      if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan.");
      if (active) { setCandidate(payload.candidate); setCandidateError(null); }
    }).catch((error: unknown) => { if (active) { setCandidate(null); setCandidateError(error instanceof Error ? error.message : "Data kandidat belum dapat dimuat."); } });
    return () => { active = false; };
  }, [candidateId, dbMode, bootstrapped]);
  const consent = screeningConsents[candidateId];

  if (!candidate) return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-3xl px-4 py-8"><p className="text-destructive">{databaseError ?? candidateError ?? "Memuat kandidat..."}</p></main></ProtectedRoute>;

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-3xl px-4 py-8">
     <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]"><ClipboardCheck className="size-4" /> Workspace Recruiter</p>
     <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">Screening berbasis privasi</h1><p className="mt-2 text-muted-foreground">Minta consent sebelum menjalankan insight kecocokan peran dan kualitas data.</p></div><Link href={`/talent/${candidate.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED]">Lihat profil <ArrowRight className="size-4" /></Link></div>
    <Card className="mt-8 overflow-hidden"><CardContent className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Kandidat yang dipilih</p><p className="mt-1 text-xl font-bold">{candidate.name ?? "Nama kandidat belum tersedia"}</p><p className="text-sm text-muted-foreground">{candidate.role ?? "Role belum tersedia"} · {candidate.location ?? "Lokasi belum tersedia"}</p></div><div className="rounded-xl bg-purple-50 p-3 text-[#7C3AED]"><ShieldCheck className="size-5" /></div></div>
       <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Tujuan</p><p className="mt-1 text-sm font-semibold">Kecocokan peran dan kualitas data</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Biaya</p><p className="mt-1 text-sm font-semibold">1 token screening</p></div></div>
      <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-sm"><p className="font-semibold text-[#7C3AED]">Consent: {consent === "pending-candidate-consent" ? "Menunggu kandidat" : consent === "consented" ? "Disetujui" : consent === "screening-completed" ? "Screening selesai" : consent === "declined" ? "Ditolak" : "Belum diminta"}</p><p className="mt-1 text-muted-foreground">Financial, credit, dan atribut sensitif tidak digunakan.</p></div>
      {consent !== "consented" && consent !== "screening-completed" && <Button variant="outline" onClick={() => requestConsent(candidateId)} disabled={consent === "pending-candidate-consent"}>{consent === "pending-candidate-consent" ? "Menunggu consent kandidat" : "Minta consent kandidat"}</Button>}
      {consent === "consented" && <Button onClick={() => startScreening(candidateId)} disabled={screeningTokens <= 0}>Mulai screening (1 token)</Button>}
      {consent === "screening-completed" && <p className="text-sm font-semibold text-[#7C3AED]">Screening selesai. Token tidak akan terpotong lagi untuk screening ini.</p>}
    </CardContent></Card>
  </main></ProtectedRoute>;
}
