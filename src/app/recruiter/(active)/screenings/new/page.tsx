"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardCheck, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { findCandidate } from "@/data/candidates";
import { useApp } from "@/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function NewScreeningPage() {
  const router = useRouter();
  const { screeningTokens, screeningConsents, screeningRunStatuses, requestConsent, startScreening, dbMode, bootstrapped } = useApp();
  const [candidateId, setCandidateId] = useState("");
  const [candidate, setCandidate] = useState<{ id: string; name: string | null; role: string | null; location: string | null } | null>(null);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [remoteRunStatus, setRemoteRunStatus] = useState<string | undefined>();
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (dbMode && !bootstrapped) return;
    const requestedId = new URLSearchParams(window.location.search).get("candidateId");
    if (requestedId) {
      setCandidateId(requestedId);
    }
  }, [dbMode, bootstrapped]);

  useEffect(() => {
    if (!candidateId || (dbMode && !bootstrapped)) return;
    let active = true;
    if (!dbMode) {
      const fixture = findCandidate(candidateId);
      if (active) {
        setCandidate(fixture ? { id: fixture.id, name: fixture.name, role: fixture.role, location: fixture.location } : null);
        setCandidateError(fixture ? null : "Kandidat tidak ditemukan.");
      }
      return () => { active = false; };
    }
    void fetch(`/api/candidates/${encodeURIComponent(candidateId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { candidate?: typeof candidate; error?: string };
        if (!response.ok || !payload.candidate) throw new Error(payload.error ?? "Profil kandidat tidak ditemukan.");
        if (active) {
          setCandidate(payload.candidate);
          setCandidateError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCandidate(null);
          setCandidateError(error instanceof Error ? error.message : "Data kandidat belum dapat dimuat.");
        }
      });
    return () => { active = false; };
  }, [candidateId, dbMode, bootstrapped]);

  const consent = candidateId ? screeningConsents[candidateId] : undefined;
  const runStatus = candidateId ? (dbMode ? remoteRunStatus : screeningRunStatuses[candidateId]) : undefined;

  useEffect(() => {
    if (!dbMode || !bootstrapped || !candidateId) return;
    void fetch(`/api/screening-runs?candidateProfileId=${encodeURIComponent(candidateId)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { run?: { status?: string } | null };
        if (response.ok) setRemoteRunStatus(payload.run?.status);
      })
      .catch(() => undefined);
  }, [bootstrapped, candidateId, dbMode]);

  const handleStartScreening = async () => {
    if (!candidateId) return;
    setLoadingAction(true);
    try {
      const success = await startScreening(candidateId);
      if (success) {
        toast.success("Screening berhasil dijalankan!", {
          description: "Membuka hasil screening dan insight kandidat.",
        });
        router.push(`/recruiter/screenings/${candidateId}`);
      } else {
        toast.error("Token screening tidak mencukupi atau screening belum dapat dijalankan.");
        setLoadingAction(false);
      }
    } catch (error) {
      toast.error("Gagal menjalankan screening", {
        description: error instanceof Error ? error.message : "Coba lagi.",
      });
      setLoadingAction(false);
    }
  };

  if (!candidate) {
    return (
      <ProtectedRoute role="recruiter">
        <main className="container mx-auto max-w-3xl px-4 py-8">
          <p className="text-muted-foreground">{candidateError ?? "Kandidat tidak ditemukan atau belum dipilih."}</p>
        </main>
      </ProtectedRoute>
    );
  }

  return <ProtectedRoute role="recruiter"><main className="container mx-auto max-w-3xl px-4 py-8">
     <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#7C3AED]"><ClipboardCheck className="size-4" /> Workspace Recruiter</p>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold">Screening kecocokan peran</h1><p className="mt-2 text-muted-foreground">Jalankan insight role fit dan kualitas data dengan satu token. Consent tetap tersedia untuk pemeriksaan finansial di masa depan.</p></div><Link href={`/talent/${candidate.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-[#7C3AED]">Lihat profil <ArrowRight className="size-4" /></Link></div>
    <Card className="mt-8 overflow-hidden"><CardContent className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Kandidat yang dipilih</p><p className="mt-1 text-xl font-bold">{candidate.name ?? "Nama kandidat belum tersedia"}</p><p className="text-sm text-muted-foreground">{candidate.role ?? "Role belum tersedia"} · {candidate.location ?? "Lokasi belum tersedia"}</p></div><div className="rounded-xl bg-purple-50 p-3 text-[#7C3AED]"><ShieldCheck className="size-5" /></div></div>
       <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Tujuan</p><p className="mt-1 text-sm font-semibold">Kecocokan peran dan kualitas data</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs uppercase tracking-wider text-muted-foreground">Biaya</p><p className="mt-1 text-sm font-semibold">1 token screening</p></div></div>
       <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-sm"><p className="font-semibold text-[#7C3AED]">Status run: {runStatus === "completed" ? "Selesai" : runStatus === "processing" ? "Sedang diproses" : "Belum dijalankan"}</p><p className="mt-1 text-muted-foreground">Role fit hanya menggunakan data profil dan tidak memerlukan consent. Consent bersifat opsional dan tetap dapat diminta untuk pemeriksaan finansial.</p></div>
         {consent !== "consented" && consent !== "screening-completed" && <Button variant="outline" onClick={() => requestConsent(candidateId)} disabled={consent === "pending-candidate-consent"}>{consent === "pending-candidate-consent" ? "Permintaan financial terkirim" : "Minta consent financial (opsional)"}</Button>}
       {runStatus !== "completed" && <Button onClick={() => void handleStartScreening()} disabled={loadingAction || screeningTokens <= 0}>{loadingAction ? <Loader2 className="size-4 animate-spin" /> : null}Mulai screening (1 token)</Button>}
       {runStatus === "completed" && <p className="text-sm font-semibold text-[#7C3AED]">Screening selesai. Status berasal dari screening run, bukan consent.</p>}
    </CardContent></Card>
  </main></ProtectedRoute>;
}
